
"""
RFC-PHOENIX-02: Kafka Consumer Implementation
At-Least-Once Semantics with Idempotent Processing

Enterprise-grade message consumer implementing:
- Manual offset commit (after DB transaction)
- Idempotency via sys.request_keys
- Exponential backoff retry (1s → 2s → 5s)
- Circuit breaker for external dependencies
- Dead Letter Queue for poison pills
- PostgreSQL transactional integration
"""

import json
import time
import hashlib
import traceback
from typing import Dict, Any, Optional, Callable, List
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

import yaml
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import ThreadedConnectionPool
from confluent_kafka import Consumer, KafkaError, KafkaException, TopicPartition
from prometheus_client import Counter, Histogram, Gauge

# Metrics
MESSAGES_CONSUMED = Counter(
    'kafka_messages_consumed_total',
    'Total messages consumed from Kafka',
    ['topic', 'consumer_group', 'status']
)
PROCESSING_LATENCY = Histogram(
    'kafka_processing_latency_seconds',
    'Latency of message processing',
    ['topic', 'consumer_group']
)
CONSUMER_LAG = Gauge(
    'kafka_consumer_lag_messages',
    'Consumer lag in messages',
    ['topic', 'partition', 'consumer_group']
)
DLQ_MESSAGES = Counter(
    'kafka_dlq_messages_total',
    'Total messages sent to DLQ',
    ['topic', 'consumer_group', 'error_type']
)


class ProcessingStatus(Enum):
    """Message processing status"""
    SUCCESS = "PROCESSED"
    DUPLICATE = "DUPLICATE"
    DLQ = "DLQ"
    SKIPPED = "SKIPPED"


class CircuitBreakerState(Enum):
    """Circuit breaker states"""
    CLOSED = "CLOSED"  # Normal operation
    OPEN = "OPEN"      # Failures detected, blocking requests
    HALF_OPEN = "HALF_OPEN"  # Testing if service recovered


@dataclass
class CircuitBreaker:
    """
    Circuit breaker implementation for external service calls
    Implements RFC Section 5.2
    """
    failure_threshold: int = 5
    success_threshold: int = 2
    timeout_seconds: int = 60
    half_open_max_calls: int = 3
    
    def __post_init__(self):
        self.state = CircuitBreakerState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[float] = None
        self.half_open_calls = 0
    
    def call(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with circuit breaker protection"""
        
        # Check if circuit is OPEN and timeout has passed
        if self.state == CircuitBreakerState.OPEN:
            if self.last_failure_time and \
               time.time() - self.last_failure_time >= self.timeout_seconds:
                print(f"🔄 Circuit breaker transitioning to HALF_OPEN")
                self.state = CircuitBreakerState.HALF_OPEN
                self.half_open_calls = 0
            else:
                raise Exception("Circuit breaker is OPEN - service unavailable")
        
        # Limit calls in HALF_OPEN state
        if self.state == CircuitBreakerState.HALF_OPEN:
            if self.half_open_calls >= self.half_open_max_calls:
                raise Exception("Circuit breaker HALF_OPEN call limit reached")
            self.half_open_calls += 1
        
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise e
    
    def _on_success(self):
        """Handle successful call"""
        self.failure_count = 0
        
        if self.state == CircuitBreakerState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.success_threshold:
                print(f"✅ Circuit breaker transitioning to CLOSED")
                self.state = CircuitBreakerState.CLOSED
                self.success_count = 0
    
    def _on_failure(self):
        """Handle failed call"""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.state == CircuitBreakerState.HALF_OPEN:
            print(f"❌ Circuit breaker transitioning back to OPEN")
            self.state = CircuitBreakerState.OPEN
            self.success_count = 0
        elif self.failure_count >= self.failure_threshold:
            print(f"❌ Circuit breaker transitioning to OPEN")
            self.state = CircuitBreakerState.OPEN


class IdempotencyManager:
    """
    Manages message idempotency using PostgreSQL
    Implements RFC Section 3.2
    """
    
    def __init__(self, db_pool: ThreadedConnectionPool):
        self.db_pool = db_pool
    
    def is_duplicate(
        self,
        message_id: str,
        conn=None
    ) -> bool:
        """
        Check if message was already processed
        Uses INSERT ON CONFLICT for atomic check
        
        Returns:
            True if duplicate (already exists), False if new
        """
        close_conn = False
        if conn is None:
            conn = self.db_pool.getconn()
            close_conn = True
        
        try:
            cursor = conn.cursor()
            
            # INSERT ON CONFLICT DO NOTHING pattern
            cursor.execute("""
                INSERT INTO sys.request_keys (key, created_at)
                VALUES (%s, NOW())
                ON CONFLICT (key) DO NOTHING
            """, (message_id,))
            
            # If rowcount is 0, it was a duplicate
            is_duplicate = cursor.rowcount == 0
            
            cursor.close()
            
            if close_conn:
                # 🚨 Commit immediately to persist idempotency record
                # This prevents double-processing if later operations fail
                conn.commit()
            
            return is_duplicate
            
        finally:
            if close_conn:
                self.db_pool.putconn(conn)
    
    def record_traceability(
        self,
        message_id: str,
        topic: str,
        partition: int,
        offset: int,
        consumer_group: str,
        status: ProcessingStatus,
        saga_correlation_id: Optional[str] = None,
        event_type: Optional[str] = None,
        conn=None
    ):
        """Record message traceability for audit purposes"""
        close_conn = False
        if conn is None:
            conn = self.db_pool.getconn()
            close_conn = True
        
        try:
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO sys.message_traceability (
                    kafka_message_id, topic, partition, "offset",
                    consumer_group, status, saga_correlation_id,
                    event_type, processed_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (kafka_message_id) DO UPDATE
                SET status = EXCLUDED.status,
                    event_type = EXCLUDED.event_type,
                    processed_at = NOW()
            """, (
                message_id, topic, partition, offset,
                consumer_group, status.value, saga_correlation_id,
                event_type or 'UNKNOWN'
            ))
            
            cursor.close()
            
        finally:
            if close_conn:
                conn.commit()
                self.db_pool.putconn(conn)


class DeadLetterQueue:
    """
    Manages Dead Letter Queue for failed messages
    Implements RFC Section 5.1
    """
    
    def __init__(self, db_pool: ThreadedConnectionPool, producer=None):
        self.db_pool = db_pool
        self.producer = producer  # For Kafka DLQ topic
    
    def send_to_dlq(
        self,
        original_topic: str,
        original_partition: int,
        original_offset: int,
        consumer_group: str,
        payload: Dict[str, Any],
        headers: Dict[str, Any],
        exception: Exception
    ):
        """Send failed message to Dead Letter Queue"""
        
        conn = self.db_pool.getconn()
        try:
            cursor = conn.cursor()
            
            # Store in PostgreSQL DLQ
            cursor.execute("""
                INSERT INTO sys.dead_letters (
                    original_topic, original_partition, original_offset,
                    consumer_group, exception_class, exception_message,
                    payload, headers, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """, (
                original_topic,
                original_partition,
                original_offset,
                consumer_group,
                type(exception).__name__,
                str(exception),
                json.dumps(payload),
                json.dumps(headers)
            ))
            
            conn.commit()
            cursor.close()
            
            # Also send to Kafka DLQ topic if producer available
            if self.producer:
                dlq_payload = {
                    'original_topic': original_topic,
                    'original_partition': original_partition,
                    'original_offset': original_offset,
                    'consumer_group': consumer_group,
                    'exception': str(exception),
                    'payload': payload,
                    'headers': headers,
                    'timestamp': datetime.utcnow().isoformat() + 'Z'
                }
                
                from .producer import MessageEnvelope
                envelope = MessageEnvelope.create(
                    message_type='DLQ_MESSAGE',
                    tenant_id=payload.get('tenant_id', 'UNKNOWN'),
                    payload=dlq_payload
                )
                
                self.producer.produce_message(
                    topic='sys.deadletter.v1',
                    message_envelope=envelope
                )
            
            print(f"📮 Message sent to DLQ: {original_topic}[{original_partition}]@{original_offset}")
            
        except Exception as e:
            print(f"❌ Failed to send message to DLQ: {e}")
            conn.rollback()
            raise e
        finally:
            self.db_pool.putconn(conn)


class KafkaConsumerClient:
    """
    Enterprise Kafka Consumer with At-Least-Once guarantees
    Implements RFC-PHOENIX-02 Algorithm (Section 3.2)
    """
    
    def __init__(
        self,
        consumer_group: str,
        topics: List[str],
        message_handler: Callable[[Dict[str, Any]], None],
        config_path: str = "config/kafka_config.yml"
    ):
        self.consumer_group = consumer_group
        self.topics = topics
        self.message_handler = message_handler
        self.config = self._load_config(config_path)
        
        # Initialize components
        self.db_pool = self._create_db_pool()
        self.consumer = self._create_consumer()
        self.idempotency_manager = IdempotencyManager(self.db_pool)
        self.dlq = DeadLetterQueue(self.db_pool)
        self.circuit_breaker = self._create_circuit_breaker()
        
        # Retry configuration from RFC Section 5.1
        self.retry_config = self.config['resilience']['retry']
        self.max_retries = self.retry_config['max_attempts']
        self.retry_intervals = [1000, 2000, 5000]  # 1s, 2s, 5s (in ms)
        
        self.running = False
    
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load Kafka configuration from YAML"""
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
    
    def _create_db_pool(self) -> ThreadedConnectionPool:
        """Create PostgreSQL connection pool"""
        db_config = self.config['database']
        
        return ThreadedConnectionPool(
            minconn=1,
            maxconn=db_config['pool_size'],
            host=db_config['host'],
            port=db_config['port'],
            database=db_config['database'],
            user=db_config['user'],
            password=db_config['password']
        )
    
    def _create_consumer(self) -> Consumer:
        """Create Kafka consumer with RFC-compliant configuration"""
        consumer_config = self.config['consumer']
        cluster_config = self.config['cluster']
        
        kafka_config = {
            'bootstrap.servers': ','.join(cluster_config['bootstrap_servers']),
            'group.id': self.consumer_group,
            'enable.auto.commit': consumer_config['enable_auto_commit'],
            'auto.offset.reset': consumer_config['auto_offset_reset'],
            'session.timeout.ms': consumer_config['session_timeout_ms'],
            'heartbeat.interval.ms': consumer_config['heartbeat_interval_ms'],
            'max.poll.interval.ms': consumer_config['max_poll_interval_ms'],
            'fetch.min.bytes': consumer_config['fetch_min_bytes'],
            'fetch.max.wait.ms': consumer_config['fetch_max_wait_ms'],
        }
        
        # Add mTLS configuration if enabled
        security_config = self.config.get('security', {})
        if security_config.get('mtls', {}).get('enabled', False):
            kafka_config.update({
                'security.protocol': consumer_config['security_protocol'],
                'ssl.ca.location': consumer_config['ssl_ca_location'],
                'ssl.certificate.location': consumer_config['ssl_cert_location'],
                'ssl.key.location': consumer_config['ssl_key_location'],
            })
        
        return Consumer(kafka_config)
    
    def _create_circuit_breaker(self) -> CircuitBreaker:
        """Create circuit breaker from configuration"""
        cb_config = self.config['resilience']['circuit_breaker']
        
        return CircuitBreaker(
            failure_threshold=cb_config['failure_threshold'],
            success_threshold=cb_config['success_threshold'],
            timeout_seconds=cb_config['timeout_seconds'],
            half_open_max_calls=cb_config['half_open_max_calls']
        )
    
    def _extract_message_id(self, msg) -> str:
        """Extract message ID from headers"""
        if msg.headers():
            for key, value in msg.headers():
                if key == 'Message-ID':
                    return value.decode('utf-8')
        
        # Fallback: hash of topic+partition+offset
        return hashlib.sha256(
            f"{msg.topic()}:{msg.partition()}:{msg.offset()}".encode()
        ).hexdigest()
    
    def _extract_headers(self, msg) -> Dict[str, str]:
        """Extract all headers as dictionary"""
        headers = {}
        if msg.headers():
            for key, value in msg.headers():
                headers[key] = value.decode('utf-8') if isinstance(value, bytes) else value
        return headers
    
    def _process_message_with_retry(
        self,
        msg,
        message_id: str,
        payload: Dict[str, Any],
        headers: Dict[str, str]
    ) -> bool:
        """
        Process message with exponential backoff retry
        Implements RFC Section 5.1 retry strategy
        
        Returns:
            True if successful, False if all retries failed
        """
        
        for attempt in range(self.max_retries):
            try:
                # Wrap handler in circuit breaker
                self.circuit_breaker.call(self.message_handler, payload)
                
                return True
                
            except Exception as e:
                print(f"⚠️ Processing attempt {attempt + 1}/{self.max_retries} failed: {e}")
                
                if attempt < self.max_retries - 1:
                    # Exponential backoff
                    backoff_ms = self.retry_intervals[attempt]
                    print(f"⏳ Retrying in {backoff_ms}ms...")
                    time.sleep(backoff_ms / 1000.0)
                else:
                    # All retries exhausted
                    print(f"❌ All retries exhausted for message {message_id}")
                    traceback.print_exc()
                    
                    # Send to DLQ
                    self.dlq.send_to_dlq(
                        original_topic=msg.topic(),
                        original_partition=msg.partition(),
                        original_offset=msg.offset(),
                        consumer_group=self.consumer_group,
                        payload=payload,
                        headers=headers,
                        exception=e
                    )
                    
                    DLQ_MESSAGES.labels(
                        topic=msg.topic(),
                        consumer_group=self.consumer_group,
                        error_type=type(e).__name__
                    ).inc()
                    
                    return False
        
        return False
    
    def _process_single_message(self, msg) -> None:
        """
        Process single message with RFC-PHOENIX-02 idempotent algorithm
        
        RFC Algorithm (Section 3.2):
        1. Read message from Kafka
        2. Extract message_id
        3. BEGIN TRANSACTION (Postgres)
        4. Insert/Verify in sys.request_keys (INSERT ON CONFLICT DO NOTHING)
           - If inserts: Process business logic
           - If conflict: Mark as duplicate, skip processing
        5. COMMIT TRANSACTION
        6. consumer.commitSync() (Kafka)
        """
        
        start_time = time.time()
        
        try:
            # Step 1: Read message from Kafka
            value = msg.value()
            if value is None:
                print(f"⚠️ Received null message, skipping")
                self.consumer.commit(message=msg)
                return
            
            # Step 2: Extract message_id
            message_id = self._extract_message_id(msg)
            headers = self._extract_headers(msg)
            
            # Parse payload
            try:
                payload = json.loads(value.decode('utf-8'))
            except json.JSONDecodeError as e:
                print(f"❌ Invalid JSON payload, sending to DLQ: {e}")
                self.dlq.send_to_dlq(
                    original_topic=msg.topic(),
                    original_partition=msg.partition(),
                    original_offset=msg.offset(),
                    consumer_group=self.consumer_group,
                    payload={'raw': value.decode('utf-8', errors='replace')},
                    headers=headers,
                    exception=e
                )
                self.consumer.commit(message=msg)
                MESSAGES_CONSUMED.labels(
                    topic=msg.topic(),
                    consumer_group=self.consumer_group,
                    status='poison_pill'
                ).inc()
                return
            
            # Step 3: Idempotency Check (separate transaction, committed immediately)
            is_duplicate = self.idempotency_manager.is_duplicate(message_id)
            
            # Step 4: BEGIN TRANSACTION (Postgres) for traceability
            conn = self.db_pool.getconn()
            try:
                
                if is_duplicate:
                    # Message already processed - skip
                    print(f"🔄 Duplicate message detected: {message_id}, skipping")
                    
                    self.idempotency_manager.record_traceability(
                        message_id=message_id,
                        topic=msg.topic(),
                        partition=msg.partition(),
                        offset=msg.offset(),
                        consumer_group=self.consumer_group,
                        status=ProcessingStatus.DUPLICATE,
                        saga_correlation_id=headers.get('Correlation-ID'),
                        event_type=payload.get('message_type', 'UNKNOWN'),
                        conn=conn
                    )
                    
                    # Step 5: COMMIT TRANSACTION
                    conn.commit()
                    
                    MESSAGES_CONSUMED.labels(
                        topic=msg.topic(),
                        consumer_group=self.consumer_group,
                        status='duplicate'
                    ).inc()
                    
                else:
                    # New message - process business logic
                    print(f"✅ Processing new message: {message_id}")
                    
                    # Process with retry logic
                    success = self._process_message_with_retry(
                        msg, message_id, payload, headers
                    )
                    
                    if success:
                        status = ProcessingStatus.SUCCESS
                        metric_status = 'success'
                    else:
                        status = ProcessingStatus.DLQ
                        metric_status = 'dlq'
                    
                    # Record traceability
                    self.idempotency_manager.record_traceability(
                        message_id=message_id,
                        topic=msg.topic(),
                        partition=msg.partition(),
                        offset=msg.offset(),
                        consumer_group=self.consumer_group,
                        status=status,
                        saga_correlation_id=headers.get('Correlation-ID'),
                        event_type=payload.get('message_type', 'UNKNOWN'),
                        conn=conn
                    )
                    
                    # Step 5: COMMIT TRANSACTION
                    conn.commit()
                    
                    MESSAGES_CONSUMED.labels(
                        topic=msg.topic(),
                        consumer_group=self.consumer_group,
                        status=metric_status
                    ).inc()
                
                # Step 6: Commit Kafka offset (Manual)
                self.consumer.commit(message=msg)
                
                # Record latency
                latency = time.time() - start_time
                PROCESSING_LATENCY.labels(
                    topic=msg.topic(),
                    consumer_group=self.consumer_group
                ).observe(latency)
                
            except Exception as e:
                # Rollback transaction on error
                conn.rollback()
                print(f"❌ Transaction rolled back: {e}")
                traceback.print_exc()
                raise
                
            finally:
                self.db_pool.putconn(conn)
                
        except Exception as e:
            print(f"❌ Fatal error processing message: {e}")
            MESSAGES_CONSUMED.labels(
                topic=msg.topic(),
                consumer_group=self.consumer_group,
                status='error'
            ).inc()
            # Don't commit offset - message will be reprocessed
    
    def start(self) -> None:
        """Start consuming messages"""
        
        print(f"🚀 Starting Kafka consumer: {self.consumer_group}")
        print(f"📚 Subscribed to topics: {self.topics}")
        
        self.consumer.subscribe(self.topics)
        self.running = True
        
        try:
            while self.running:
                msg = self.consumer.poll(timeout=1.0)
                
                if msg is None:
                    continue
                
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        print(f"📭 Reached end of partition {msg.partition()}")
                    else:
                        print(f"❌ Consumer error: {msg.error()}")
                    continue
                
                # Process message
                self._process_single_message(msg)
                
        except KeyboardInterrupt:
            print("\n⏹️ Shutdown requested by user")
        finally:
            self.close()
    
    def stop(self) -> None:
        """Stop consuming messages"""
        print("⏹️ Stopping consumer...")
        self.running = False
    
    def close(self) -> None:
        """Close consumer and cleanup resources"""
        print("🔒 Closing consumer...")
        self.consumer.close()
        self.db_pool.closeall()
        print("✅ Consumer closed")


if __name__ == "__main__":
    """Example usage"""
    
    def example_handler(payload: Dict[str, Any]) -> None:
        """Example message handler"""
        print(f"📥 Received message: {payload.get('message_type', 'UNKNOWN')}")
        
        # Simulate processing
        time.sleep(0.1)
        
        # Example: Validate required fields
        if 'tenant_id' not in payload:
            raise ValueError("Missing tenant_id in payload")
        
        print(f"✅ Message processed successfully")
    
    # Create consumer
    consumer = KafkaConsumerClient(
        consumer_group="example-consumer-group",
        topics=["core.commands.v1"],
        message_handler=example_handler
    )
    
    # Start consuming
    consumer.start()
