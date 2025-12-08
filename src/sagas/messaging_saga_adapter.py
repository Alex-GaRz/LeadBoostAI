
"""
RFC-PHOENIX-02: SAGA Coordinator Messaging Adapter
Integrates SAGA orchestration with Kafka messaging layer

Replaces direct HTTP calls to microservices with asynchronous command publishing.
Implements event-driven SAGA pattern per RFC Section 4.
"""

import json
import uuid
import time
import threading
from typing import Dict, Any, Optional, List, Callable
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass, asdict

import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import ThreadedConnectionPool

# Import messaging components
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from messaging.producer import KafkaProducerClient, get_producer
from messaging.consumer import KafkaConsumerClient


class SagaState(Enum):
    """SAGA execution states"""
    PENDING = "PENDING"
    STARTED = "STARTED"
    COMMAND_SENT = "COMMAND_SENT"
    EVENT_RECEIVED = "EVENT_RECEIVED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    COMPENSATING = "COMPENSATING"
    COMPENSATED = "COMPENSATED"


class SagaStepType(Enum):
    """Types of SAGA steps"""
    COMMAND = "COMMAND"  # Send command to topic
    WAIT_EVENT = "WAIT_EVENT"  # Wait for event from topic
    COMPENSATE = "COMPENSATE"  # Compensation action


@dataclass
class SagaStep:
    """Individual step in a SAGA"""
    step_id: str
    step_type: SagaStepType
    target_service: str
    command_type: Optional[str] = None
    expected_event_type: Optional[str] = None
    compensation_command: Optional[str] = None
    timeout_seconds: int = 300  # 5 minutes default
    payload: Optional[Dict[str, Any]] = None
    status: str = "PENDING"
    retry_count: int = 0
    max_retries: int = 3


@dataclass
class SagaDefinition:
    """Complete SAGA definition with steps"""
    saga_id: str
    saga_type: str
    tenant_id: str
    correlation_id: str
    steps: List[SagaStep]
    current_step_index: int = 0
    state: SagaState = SagaState.PENDING
    created_at: str = None
    updated_at: str = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow().isoformat() + 'Z'
        if self.updated_at is None:
            self.updated_at = self.created_at
        if self.metadata is None:
            self.metadata = {}


class MessagingSagaCoordinator:
    """
    SAGA Coordinator with Kafka Integration
    
    Orchestrates distributed transactions using event-driven messaging:
    1. SAGA publishes command to core.commands.v1
    2. Service consumes command -> executes -> publishes event to core.events.v1
    3. SAGA consumes event -> advances to next step
    
    Implements RFC-PHOENIX-02 Section 4
    """
    
    def __init__(
        self,
        db_pool: ThreadedConnectionPool,
        config_path: str = "config/kafka_config.yml"
    ):
        self.db_pool = db_pool
        self.producer = get_producer(config_path)
        
        # Event handlers registry
        self.event_handlers: Dict[str, Callable] = {}
        
        # Consumer for listening to events
        self.consumer: Optional[KafkaConsumerClient] = None
        
        # In-memory SAGA state cache (for performance)
        self.active_sagas: Dict[str, SagaDefinition] = {}
        self._lock = threading.RLock()
    
    def register_event_handler(
        self,
        event_type: str,
        handler: Callable[[Dict[str, Any]], None]
    ):
        """Register handler for specific event type"""
        self.event_handlers[event_type] = handler
        print(f"📝 Registered handler for event: {event_type}")
    
    def create_saga(
        self,
        saga_type: str,
        tenant_id: str,
        steps: List[SagaStep],
        metadata: Optional[Dict[str, Any]] = None
    ) -> SagaDefinition:
        """
        Create and persist a new SAGA definition
        
        Args:
            saga_type: Type of SAGA (e.g., "CreateCampaign", "ProcessPayment")
            tenant_id: Tenant identifier
            steps: Ordered list of steps to execute
            metadata: Additional SAGA metadata
            
        Returns:
            SagaDefinition instance
        """
        saga_id = str(uuid.uuid4())
        correlation_id = str(uuid.uuid4())
        
        saga = SagaDefinition(
            saga_id=saga_id,
            saga_type=saga_type,
            tenant_id=tenant_id,
            correlation_id=correlation_id,
            steps=steps,
            metadata=metadata or {}
        )
        
        # Persist to database
        self._persist_saga(saga)
        
        # Add to active cache
        with self._lock:
            self.active_sagas[saga_id] = saga
        
        print(f"🆕 Created SAGA {saga_id} ({saga_type}) with {len(steps)} steps")
        
        return saga
    
    def _persist_saga(self, saga: SagaDefinition):
        """Persist SAGA to database"""
        conn = self.db_pool.getconn()
        try:
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO sys.sagas (
                    saga_id, saga_type, tenant_id, correlation_id,
                    current_step, state, payload, created_at, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (saga_id) DO UPDATE
                SET current_step = EXCLUDED.current_step,
                    state = EXCLUDED.state,
                    payload = EXCLUDED.payload,
                    updated_at = EXCLUDED.updated_at
            """, (
                saga.saga_id,
                saga.saga_type,
                saga.tenant_id,
                saga.correlation_id,
                saga.current_step_index,
                saga.state.value,
                json.dumps({
                    'steps': [asdict(step) for step in saga.steps],
                    'metadata': saga.metadata
                }),
                saga.created_at,
                saga.updated_at
            ))
            
            conn.commit()
            cursor.close()
            
        finally:
            self.db_pool.putconn(conn)
    
    def _load_saga(self, saga_id: str) -> Optional[SagaDefinition]:
        """Load SAGA from database"""
        conn = self.db_pool.getconn()
        try:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT * FROM sys.sagas WHERE saga_id = %s
            """, (saga_id,))
            
            row = cursor.fetchone()
            cursor.close()
            
            if not row:
                return None
            
            # Reconstruct SAGA
            payload = json.loads(row['payload'])
            steps = [SagaStep(**step_data) for step_data in payload['steps']]
            
            saga = SagaDefinition(
                saga_id=row['saga_id'],
                saga_type=row['saga_type'],
                tenant_id=row['tenant_id'],
                correlation_id=row['correlation_id'],
                steps=steps,
                current_step_index=row['current_step'],
                state=SagaState(row['state']),
                created_at=row['created_at'].isoformat() + 'Z',
                updated_at=row['updated_at'].isoformat() + 'Z',
                metadata=payload.get('metadata', {})
            )
            
            return saga
            
        finally:
            self.db_pool.putconn(conn)
    
    def execute_saga(self, saga_id: str) -> bool:
        """
        Execute SAGA by processing steps sequentially
        
        Args:
            saga_id: SAGA identifier
            
        Returns:
            True if SAGA completed successfully, False otherwise
        """
        saga = self.active_sagas.get(saga_id) or self._load_saga(saga_id)
        
        if not saga:
            print(f"❌ SAGA {saga_id} not found")
            return False
        
        print(f"▶️ Executing SAGA {saga_id} ({saga.saga_type})")
        
        saga.state = SagaState.STARTED
        saga.updated_at = datetime.utcnow().isoformat() + 'Z'
        self._persist_saga(saga)
        
        try:
            while saga.current_step_index < len(saga.steps):
                step = saga.steps[saga.current_step_index]
                
                print(f"  Step {saga.current_step_index + 1}/{len(saga.steps)}: {step.step_type.value}")
                
                if step.step_type == SagaStepType.COMMAND:
                    success = self._execute_command_step(saga, step)
                elif step.step_type == SagaStepType.WAIT_EVENT:
                    success = self._execute_wait_event_step(saga, step)
                else:
                    print(f"⚠️ Unknown step type: {step.step_type}")
                    success = False
                
                if not success:
                    print(f"❌ Step {saga.current_step_index + 1} failed")
                    saga.state = SagaState.FAILED
                    self._persist_saga(saga)
                    
                    # Trigger compensation
                    self._compensate_saga(saga)
                    return False
                
                # Move to next step
                saga.current_step_index += 1
                saga.updated_at = datetime.utcnow().isoformat() + 'Z'
                self._persist_saga(saga)
            
            # All steps completed
            saga.state = SagaState.COMPLETED
            saga.updated_at = datetime.utcnow().isoformat() + 'Z'
            self._persist_saga(saga)
            
            print(f"✅ SAGA {saga_id} completed successfully")
            return True
            
        except Exception as e:
            print(f"❌ SAGA {saga_id} execution failed: {e}")
            saga.state = SagaState.FAILED
            self._persist_saga(saga)
            self._compensate_saga(saga)
            return False
    
    def _execute_command_step(self, saga: SagaDefinition, step: SagaStep) -> bool:
        """
        Execute command step by publishing to Kafka
        
        RFC Section 4 Example:
        1. SAGA publishes CreateCampaign to core.commands.v1
        2. Returns immediately (async)
        """
        print(f"    📤 Publishing command: {step.command_type}")
        
        try:
            # Prepare command payload
            command_payload = step.payload or {}
            command_payload['saga_id'] = saga.saga_id
            command_payload['correlation_id'] = saga.correlation_id
            
            # Publish command
            success = self.producer.produce_command(
                tenant_id=saga.tenant_id,
                command_type=step.command_type,
                payload=command_payload,
                correlation_id=saga.correlation_id
            )
            
            if success:
                step.status = "SENT"
                saga.state = SagaState.COMMAND_SENT
                print(f"    ✅ Command published successfully")
                return True
            else:
                print(f"    ❌ Failed to publish command")
                return False
                
        except Exception as e:
            print(f"    ❌ Command step failed: {e}")
            return False
    
    def _execute_wait_event_step(self, saga: SagaDefinition, step: SagaStep) -> bool:
        """
        Wait for expected event from Kafka
        
        RFC Section 4 Example:
        3. SAGA waits for CampaignCreated event from core.events.v1
        4. Event arrives via consumer -> advances state
        
        Note: This is a blocking wait with timeout.
        In production, consider async/callback pattern.
        """
        print(f"    ⏳ Waiting for event: {step.expected_event_type}")
        
        timeout = step.timeout_seconds
        start_time = time.time()
        
        # Poll for event using sys.message_traceability as source of truth
        while time.time() - start_time < timeout:
            # Check if event was received and processed
            event = self._check_for_event(
                correlation_id=saga.correlation_id,
                event_type=step.expected_event_type
            )
            
            if event:
                print(f"    ✅ Event received: {step.expected_event_type}")
                step.status = "COMPLETED"
                saga.state = SagaState.EVENT_RECEIVED
                saga.updated_at = datetime.utcnow().isoformat() + 'Z'
                self._persist_saga(saga)
                return True
            
            # Wait before next check (avoid busy-wait)
            time.sleep(1)
        
        # Timeout: event did not arrive
        print(f"    ⏱️ Timeout waiting for event: {step.expected_event_type}")
        step.status = "TIMEOUT"
        saga.state = SagaState.FAILED
        saga.updated_at = datetime.utcnow().isoformat() + 'Z'
        self._persist_saga(saga)
        return False
    
    def _check_for_event(self, correlation_id: str, event_type: str) -> Optional[Dict[str, Any]]:
        """
        Check if expected event was received
        Queries sys.message_traceability table
        """
        conn = self.db_pool.getconn()
        try:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT * FROM sys.message_traceability
                WHERE saga_correlation_id = %s
                  AND event_type = %s
                  AND status = 'PROCESSED'
                  AND processed_at > NOW() - INTERVAL '5 minutes'
                ORDER BY processed_at DESC
                LIMIT 1
            """, (correlation_id, event_type))
            
            row = cursor.fetchone()
            cursor.close()
            
            if row:
                return dict(row)
            return None
            
        finally:
            self.db_pool.putconn(conn)
    
    def _compensate_saga(self, saga: SagaDefinition):
        """
        Execute compensation logic for failed SAGA
        Runs compensation commands in reverse order
        """
        print(f"🔄 Starting compensation for SAGA {saga.saga_id}")
        
        saga.state = SagaState.COMPENSATING
        self._persist_saga(saga)
        
        # Execute compensation in reverse order
        for i in range(saga.current_step_index - 1, -1, -1):
            step = saga.steps[i]
            
            if step.compensation_command:
                print(f"  Compensating step {i + 1}: {step.compensation_command}")
                
                compensation_payload = {
                    'saga_id': saga.saga_id,
                    'correlation_id': saga.correlation_id,
                    'original_step': i,
                    'reason': 'SAGA_COMPENSATION'
                }
                
                self.producer.produce_command(
                    tenant_id=saga.tenant_id,
                    command_type=step.compensation_command,
                    payload=compensation_payload,
                    correlation_id=saga.correlation_id
                )
        
        saga.state = SagaState.COMPENSATED
        saga.updated_at = datetime.utcnow().isoformat() + 'Z'
        self._persist_saga(saga)
        
        print(f"✅ Compensation completed for SAGA {saga.saga_id}")
    
    def handle_event(self, event_payload: Dict[str, Any]):
        """
        Handle incoming event from consumer
        Routes to registered handler or advances SAGA state
        """
        event_type = event_payload.get('message_type')
        correlation_id = event_payload.get('correlation_id')
        
        print(f"📨 Received event: {event_type} (correlation: {correlation_id})")
        
        # Check if event is for an active SAGA
        with self._lock:
            for saga_id, saga in self.active_sagas.items():
                if saga.correlation_id == correlation_id:
                    current_step = saga.steps[saga.current_step_index]
                    
                    if (current_step.step_type == SagaStepType.WAIT_EVENT and
                        current_step.expected_event_type == event_type):
                        print(f"✅ Event matched SAGA {saga_id}, step {saga.current_step_index + 1}")
                        # Event will be picked up by _check_for_event
        
        # Call registered handler
        if event_type in self.event_handlers:
            try:
                self.event_handlers[event_type](event_payload)
            except Exception as e:
                print(f"❌ Event handler failed: {e}")
    
    def start_event_consumer(self):
        """Start Kafka consumer for event handling"""
        print("🚀 Starting SAGA event consumer...")
        
        self.consumer = KafkaConsumerClient(
            consumer_group="saga-coordinator",
            topics=["core.events.v1"],
            message_handler=self.handle_event
        )
        
        # Start in separate thread for non-blocking operation
        import threading
        consumer_thread = threading.Thread(target=self.consumer.start, daemon=True)
        consumer_thread.start()
        
        print("✅ SAGA event consumer started")


# ===========================
# EXAMPLE SAGA DEFINITIONS
# ===========================

def create_campaign_saga(
    coordinator: MessagingSagaCoordinator,
    tenant_id: str,
    campaign_data: Dict[str, Any]
) -> str:
    """
    Example: Create Campaign SAGA
    
    Steps:
    1. Send CreateCampaign command to Actuator
    2. Wait for CampaignCreated event
    3. Send AllocateBudget command to Finance
    4. Wait for BudgetAllocated event
    5. Send ActivateCampaign command to Actuator
    6. Wait for CampaignActivated event
    """
    
    steps = [
        SagaStep(
            step_id="create_campaign",
            step_type=SagaStepType.COMMAND,
            target_service="actuator",
            command_type="CreateCampaign",
            compensation_command="DeleteCampaign",
            payload=campaign_data
        ),
        SagaStep(
            step_id="wait_campaign_created",
            step_type=SagaStepType.WAIT_EVENT,
            target_service="actuator",
            expected_event_type="CampaignCreated"
        ),
        SagaStep(
            step_id="allocate_budget",
            step_type=SagaStepType.COMMAND,
            target_service="finance",
            command_type="AllocateBudget",
            compensation_command="ReleaseBudget",
            payload={'amount': campaign_data.get('budget', 0)}
        ),
        SagaStep(
            step_id="wait_budget_allocated",
            step_type=SagaStepType.WAIT_EVENT,
            target_service="finance",
            expected_event_type="BudgetAllocated"
        ),
        SagaStep(
            step_id="activate_campaign",
            step_type=SagaStepType.COMMAND,
            target_service="actuator",
            command_type="ActivateCampaign",
            compensation_command="DeactivateCampaign",
            payload={'campaign_id': campaign_data.get('campaign_id')}
        ),
        SagaStep(
            step_id="wait_campaign_activated",
            step_type=SagaStepType.WAIT_EVENT,
            target_service="actuator",
            expected_event_type="CampaignActivated"
        ),
    ]
    
    saga = coordinator.create_saga(
        saga_type="CreateCampaign",
        tenant_id=tenant_id,
        steps=steps,
        metadata=campaign_data
    )
    
    return saga.saga_id


if __name__ == "__main__":
    """Example usage"""
    
    # Create DB pool
    db_pool = ThreadedConnectionPool(
        minconn=1,
        maxconn=5,
        host="localhost",
        port=5432,
        database="leadboost",
        user="postgres",
        password="password"
    )
    
    # Create coordinator
    coordinator = MessagingSagaCoordinator(db_pool)
    
    # Start event consumer
    coordinator.start_event_consumer()
    
    # Create and execute SAGA
    saga_id = create_campaign_saga(
        coordinator=coordinator,
        tenant_id="tenant-123",
        campaign_data={
            'campaign_id': 'camp-456',
            'name': 'Summer Sale 2025',
            'budget': 5000.00,
            'target_audience': 'tech_enthusiasts'
        }
    )
    
    # Execute SAGA
    success = coordinator.execute_saga(saga_id)
    
    if success:
        print(f"✅ SAGA {saga_id} completed successfully")
    else:
        print(f"❌ SAGA {saga_id} failed")
