"""
Orchestrator Finite State Machine (FSM) using transitions library.
"""

from transitions import Machine
from typing import Optional
import logging

from contracts import CampaignPayload, CampaignState, FailureReason, QualityVerdict, Severity
from infrastructure.service_client import ServiceClient
from infrastructure.idempotency import IdempotencyStore

logger = logging.getLogger(__name__)


class OrchestratorFSM:
    """
    Campaign workflow state machine.
    
    State Graph:
    IDLE -> RADAR_SCAN -> STRATEGY_GEN -> CONTENT_PROD -> QUALITY_AUDIT -> PUBLISH -> LEARN
                                    ↓                                  ↓
                                  FAILED                             FAILED
    """
    
    # Define states
    states = [
        CampaignState.IDLE,
        CampaignState.RADAR_SCAN,
        CampaignState.STRATEGY_GEN,
        CampaignState.CONTENT_PROD,
        CampaignState.QUALITY_AUDIT,
        CampaignState.PUBLISH,
        CampaignState.LEARN,
        CampaignState.FAILED,
    ]
    
    def __init__(
        self,
        payload: CampaignPayload,
        service_client: ServiceClient,
        idempotency_store: IdempotencyStore,
    ):
        """Initialize the FSM with a payload and dependencies."""
        self.payload = payload
        self.service_client = service_client
        self.idempotency_store = idempotency_store
        
        # Initialize the state machine
        self.machine = Machine(
            model=self,
            states=OrchestratorFSM.states,
            initial=payload.current_state,
            auto_transitions=False,
        )
        
        # Define transitions
        self._setup_transitions()
    
    def _setup_transitions(self):
        """Define all valid state transitions."""
        
        # IDLE -> RADAR_SCAN
        self.machine.add_transition(
            trigger='start_radar_scan',
            source=CampaignState.IDLE,
            dest=CampaignState.RADAR_SCAN,
            before='_before_radar_scan',
            after='_after_radar_scan',
        )
        
        # RADAR_SCAN -> STRATEGY_GEN
        self.machine.add_transition(
            trigger='generate_strategy',
            source=CampaignState.RADAR_SCAN,
            dest=CampaignState.STRATEGY_GEN,
            before='_before_strategy_gen',
            after='_after_strategy_gen',
        )
        
        # STRATEGY_GEN -> CONTENT_PROD
        self.machine.add_transition(
            trigger='produce_content',
            source=CampaignState.STRATEGY_GEN,
            dest=CampaignState.CONTENT_PROD,
            before='_before_content_prod',
            after='_after_content_prod',
        )
        
        # CONTENT_PROD -> QUALITY_AUDIT
        self.machine.add_transition(
            trigger='audit_quality',
            source=CampaignState.CONTENT_PROD,
            dest=CampaignState.QUALITY_AUDIT,
            before='_before_quality_audit',
            after='_after_quality_audit',
        )
        
        # QUALITY_AUDIT -> PUBLISH (with condition)
        self.machine.add_transition(
            trigger='publish_campaign',
            source=CampaignState.QUALITY_AUDIT,
            dest=CampaignState.PUBLISH,
            conditions='_check_quality_gate',
            before='_before_publish',
            after='_after_publish',
        )
        
        # QUALITY_AUDIT -> FAILED (quality check failed)
        self.machine.add_transition(
            trigger='fail_quality',
            source=CampaignState.QUALITY_AUDIT,
            dest=CampaignState.FAILED,
            unless='_check_quality_gate',
            before='_before_fail_quality',
        )
        
        # PUBLISH -> LEARN
        self.machine.add_transition(
            trigger='learn_from_campaign',
            source=CampaignState.PUBLISH,
            dest=CampaignState.LEARN,
            before='_before_learn',
            after='_after_learn',
        )
        
        # Any state -> FAILED (for error handling)
        for state in [
            CampaignState.IDLE,
            CampaignState.RADAR_SCAN,
            CampaignState.STRATEGY_GEN,
            CampaignState.CONTENT_PROD,
            CampaignState.QUALITY_AUDIT,
            CampaignState.PUBLISH,
        ]:
            self.machine.add_transition(
                trigger='fail_with_error',
                source=state,
                dest=CampaignState.FAILED,
                before='_before_fail_with_error',
            )
    
    # ============================================================
    # TRANSITION CALLBACKS
    # ============================================================
    
    # --- RADAR SCAN ---
    
    def _before_radar_scan(self):
        """Check idempotency before starting radar scan."""
        logger.info(f"Starting radar scan for campaign {self.payload.campaign_id}")
        self.payload.add_trace("orchestrator_fsm", "transition_to_radar_scan")
    
    async def _after_radar_scan(self):
        """Execute radar scan service call."""
        try:
            # Call radar service
            result = await self.service_client.call_radar_scan(self.payload)
            self.payload.add_trace("radar_service", "scan_completed", result)
            logger.info(f"Radar scan completed for campaign {self.payload.campaign_id}")
        except Exception as e:
            logger.error(f"Radar scan failed: {str(e)}")
            raise
    
    # --- STRATEGY GENERATION ---
    
    def _before_strategy_gen(self):
        """Prepare for strategy generation."""
        logger.info(f"Generating strategy for campaign {self.payload.campaign_id}")
        self.payload.add_trace("orchestrator_fsm", "transition_to_strategy_gen")
    
    async def _after_strategy_gen(self):
        """Execute strategy generation service call."""
        try:
            # Call analyst service
            strategy = await self.service_client.call_strategy_generation(self.payload)
            self.payload.strategy = strategy
            self.payload.add_trace("analyst_service", "strategy_generated")
            logger.info(f"Strategy generated for campaign {self.payload.campaign_id}")
        except Exception as e:
            logger.error(f"Strategy generation failed: {str(e)}")
            raise
    
    # --- CONTENT PRODUCTION ---
    
    def _before_content_prod(self):
        """Prepare for content production."""
        logger.info(f"Producing content for campaign {self.payload.campaign_id}")
        self.payload.add_trace("orchestrator_fsm", "transition_to_content_prod")
    
    async def _after_content_prod(self):
        """Execute content production service call."""
        try:
            # Call visual service
            assets = await self.service_client.call_content_production(self.payload)
            self.payload.assets = assets
            self.payload.add_trace("visual_service", "content_produced")
            logger.info(f"Content produced for campaign {self.payload.campaign_id}")
        except Exception as e:
            logger.error(f"Content production failed: {str(e)}")
            raise
    
    # --- QUALITY AUDIT ---
    
    def _before_quality_audit(self):
        """Prepare for quality audit."""
        logger.info(f"Auditing quality for campaign {self.payload.campaign_id}")
        self.payload.add_trace("orchestrator_fsm", "transition_to_quality_audit")
    
    async def _after_quality_audit(self):
        """Execute quality audit service call."""
        try:
            # Call optimizer service (quality audit)
            report = await self.service_client.call_quality_audit(self.payload)
            self.payload.quality_audit = report
            self.payload.add_trace("optimizer_service", "quality_audited")
            logger.info(f"Quality audit completed for campaign {self.payload.campaign_id}")
        except Exception as e:
            logger.error(f"Quality audit failed: {str(e)}")
            raise
    
    def _check_quality_gate(self) -> bool:
        """
        Strict quality gate check (Enterprise Grade).
        
        Returns:
            True if quality checks pass, False otherwise.
        """
        report = self.payload.quality_audit
        
        # 1. Existence
        if not report:
            logger.warning(f"No quality report found for campaign {self.payload.campaign_id}")
            return False
        
        # 2. Verdict
        if report.verdict == QualityVerdict.FAIL:
            # Extract the most severe failure
            critical_failure = next(
                (c for c in report.checks if c.severity == Severity.CRITICAL),
                None
            )
            reason_code = critical_failure.reason_code if critical_failure else "Unknown"
            
            self.payload.terminal_reason = FailureReason.QUALITY_CHECK_FAILED
            self.payload.terminal_details = f"Blocked by: {reason_code}"
            
            logger.warning(
                f"Quality gate failed for campaign {self.payload.campaign_id}: {reason_code}"
            )
            return False
        
        # 3. Severity check (No CRITICAL issues allowed)
        critical_issues = [c for c in report.checks if c.severity == Severity.CRITICAL]
        if critical_issues:
            reasons = [c.reason_code for c in critical_issues]
            logger.warning(
                f"Critical issues found for campaign {self.payload.campaign_id}: {reasons}"
            )
            return False
        
        logger.info(f"Quality gate passed for campaign {self.payload.campaign_id}")
        return True
    
    def _before_fail_quality(self):
        """Handle quality check failure."""
        logger.error(f"Quality check failed for campaign {self.payload.campaign_id}")
        self.payload.add_trace("orchestrator_fsm", "quality_check_failed")
    
    # --- PUBLISH ---
    
    def _before_publish(self):
        """Prepare for publication."""
        logger.info(f"Publishing campaign {self.payload.campaign_id}")
        self.payload.add_trace("orchestrator_fsm", "transition_to_publish")
    
    async def _after_publish(self):
        """Execute publication service call."""
        try:
            # Call optimizer service (publication)
            result = await self.service_client.call_publish_campaign(self.payload)
            self.payload.add_trace("optimizer_service", "campaign_published", result)
            logger.info(f"Campaign {self.payload.campaign_id} published successfully")
        except Exception as e:
            logger.error(f"Publication failed: {str(e)}")
            raise
    
    # --- LEARN ---
    
    def _before_learn(self):
        """Prepare for learning phase."""
        logger.info(f"Learning from campaign {self.payload.campaign_id}")
        self.payload.add_trace("orchestrator_fsm", "transition_to_learn")
    
    async def _after_learn(self):
        """Execute learning service call."""
        try:
            # Call memory service (learning)
            result = await self.service_client.call_learn_from_campaign(self.payload)
            self.payload.add_trace("memory_service", "learning_completed", result)
            logger.info(f"Learning completed for campaign {self.payload.campaign_id}")
        except Exception as e:
            logger.error(f"Learning phase failed: {str(e)}")
            raise
    
    # --- ERROR HANDLING ---
    
    def _before_fail_with_error(self):
        """Handle generic error transition to FAILED state."""
        logger.error(f"Campaign {self.payload.campaign_id} failed")
        self.payload.add_trace("orchestrator_fsm", "transition_to_failed")
    
    # ============================================================
    # PUBLIC METHODS
    # ============================================================
    
    async def execute_workflow(self):
        """
        Execute the full workflow from current state to completion.
        
        SECURITY PATCH: Implements distributed lock to prevent concurrent execution.
        """
        campaign_id = self.payload.campaign_id
        execution_id = self.payload.execution_id
        
        logger.info(f"Starting workflow execution for campaign {campaign_id}")
        
        # 1. ACQUIRE LOCK - Prevent concurrent execution
        lock_acquired = await self.idempotency_store.acquire_lock(campaign_id, execution_id)
        if not lock_acquired:
            logger.warning(
                f"Workflow already running for {campaign_id}:{execution_id}. "
                "Returning current payload to prevent duplicate execution."
            )
            return self.payload
        
        # 2. CHECK IF ALREADY PROCESSED - Return cached result
        is_processed = await self.idempotency_store.is_workflow_processed(campaign_id, execution_id)
        if is_processed:
            cached = await self.idempotency_store.get_cached_payload(campaign_id, execution_id)
            if cached:
                logger.info(f"Workflow already processed for {campaign_id}:{execution_id}. Returning cached result.")
                # Reconstruct payload from cached data
                return CampaignPayload(**cached)
            else:
                logger.warning(f"Workflow marked as processed but no cache found: {campaign_id}:{execution_id}")
        
        # 3. EXECUTE WORKFLOW with try/finally to ensure lock release
        try:
            # Execute state transitions in order
            if self.state == CampaignState.IDLE:
                self.start_radar_scan()
                await self._after_radar_scan()
            
            if self.state == CampaignState.RADAR_SCAN:
                self.generate_strategy()
                await self._after_strategy_gen()
            
            if self.state == CampaignState.STRATEGY_GEN:
                self.produce_content()
                await self._after_content_prod()
            
            if self.state == CampaignState.CONTENT_PROD:
                self.audit_quality()
                await self._after_quality_audit()
            
            if self.state == CampaignState.QUALITY_AUDIT:
                if self._check_quality_gate():
                    self.publish_campaign()
                    await self._after_publish()
                else:
                    self.fail_quality()
                    # Mark as processed even if quality failed
                    await self.idempotency_store.mark_workflow_processed(
                        campaign_id,
                        execution_id,
                        self.payload.model_dump()
                    )
                    return self.payload  # Stop here
            
            if self.state == CampaignState.PUBLISH:
                self.learn_from_campaign()
                await self._after_learn()
            
            # 4. MARK AS PROCESSED - Cache successful completion
            await self.idempotency_store.mark_workflow_processed(
                campaign_id,
                execution_id,
                self.payload.model_dump()
            )
            
            logger.info(f"Workflow completed successfully for campaign {campaign_id}")
            
        except Exception as e:
            logger.error(f"Workflow execution failed: {str(e)}")
            self.payload.mark_failed(FailureReason.PLATFORM_ERROR, str(e))
            self.fail_with_error()
            
            # Mark as processed with error state
            await self.idempotency_store.mark_workflow_processed(
                campaign_id,
                execution_id,
                self.payload.model_dump()
            )
        
        finally:
            # 5. RELEASE LOCK - Always release, even on error
            await self.idempotency_store.release_lock(campaign_id, execution_id)
            logger.debug(f"Lock released for workflow: {campaign_id}:{execution_id}")
        
        return self.payload
