"""Execution Service - Core orchestration logic (Application Layer)."""

import logging
from typing import Optional
from fastapi import HTTPException

from core.domain_models import ActionPayload, ExecutionResult, ActionStatus
from core.db_repo import LedgerRepository
from handlers.factory import HandlerFactory
from core.exceptions import GovernanceViolationError, PlatformError

logger = logging.getLogger(__name__)


class ExecutionService:
    """
    Orchestrates the secure execution pipeline.
    Enforces DMC Invariant #5: "The Actuator does not think, it only executes."
    
    Security Fixes:
    - AUD-01: Uses atomic lock acquisition to prevent race conditions
    - AUD-03: Robust error handling with guaranteed status updates
    """
    
    def __init__(self, ledger_repo: LedgerRepository):
        self.ledger = ledger_repo
        logger.info("ExecutionService initialized with security patches")
    
    async def execute_action(
        self, 
        payload: ActionPayload, 
        tenant_id: str = "default"
    ) -> ExecutionResult:
        """
        THE SECURE EXECUTION PIPELINE (RFC-PHOENIX-04 Section 2.2) - SECURITY HARDENED.
        
        Pipeline stages:
        1. Atomic Governance Lock (AUD-01 FIX: prevents race conditions)
        2. Handler Selection (Factory Pattern)
        3. Platform Execution (Polymorphic call with robust error handling)
        4. Result Persistence (AUD-03 FIX: guaranteed status update)
        
        Args:
            payload: Action payload with content and targeting.
            tenant_id: Tenant identifier for multi-tenancy.
            
        Returns:
            ExecutionResult: Execution outcome with platform ref ID.
            
        Raises:
            HTTPException: 409 if lock fails, 501 if platform not implemented, 500 for other errors
        """
        action_id = payload.action_id
        logger.info(f"[{action_id}] Starting SECURE execution pipeline (AUD-01, AUD-03 compliant)")
        
        # STAGE 1: ATOMIC GOVERNANCE LOCK (AUD-01 FIX)
        logger.info(f"[{action_id}] Stage 1: Acquiring atomic execution lock...")
        lock_acquired = await self.ledger.acquire_execution_lock(action_id, tenant_id)
        
        if not lock_acquired:
            logger.error(
                f"[{action_id}] LOCK ACQUISITION FAILED: "
                "Action not approved, already executing, or race condition detected"
            )
            raise HTTPException(
                status_code=409,
                detail={
                    "error": "LockAcquisitionFailed",
                    "message": "Action not approved by HITL or race condition detected",
                    "action_id": action_id,
                    "documentation": "See DMC v1.0 Chapter: Execution Safeguards",
                    "audit_code": "AUD-01"
                }
            )
        
        logger.info(f"[{action_id}] ✅ Atomic lock acquired (status: EXECUTING)")
        
        # STAGE 2: HANDLER SELECTION
        logger.info(f"[{action_id}] Stage 2: Selecting platform handler...")
        try:
            handler = HandlerFactory.get_handler(payload.platform)
            logger.info(f"[{action_id}] Handler selected: {handler.__class__.__name__}")
        except NotImplementedError as e:
            logger.error(f"[{action_id}] Platform handler not available: {e}")
            # AUD-03: Ensure status updated even on handler selection failure
            try:
                await self.ledger.update_status(
                    action_id,
                    ActionStatus.FAILED.value,
                    {"error": "PlatformNotImplemented", "message": str(e)}
                )
            except Exception as update_error:
                logger.critical(f"[{action_id}] CRITICAL: Failed to update status after handler error: {update_error}")
            
            raise HTTPException(
                status_code=501,
                detail={
                    "error": "PlatformNotImplemented",
                    "message": str(e),
                    "platform": payload.platform.value
                }
            )
        
        # STAGE 3: PLATFORM EXECUTION (with robust error handling)
        logger.info(f"[{action_id}] Stage 3: Executing on platform {payload.platform}...")
        result = None
        
        try:
            result = await handler.post_content(payload)
            logger.info(
                f"[{action_id}] Platform execution completed: "
                f"status={result.status}, ref_id={result.platform_ref_id}"
            )
            
        except Exception as e:
            logger.error(f"[{action_id}] Platform execution failed: {e}", exc_info=True)
            
            # Create failure result
            result = ExecutionResult(
                action_id=action_id,
                status=ActionStatus.FAILED,
                error_message=str(e),
                metadata={
                    "exception_type": type(e).__name__,
                    "exception_details": str(e)
                }
            )
        
        # STAGE 4: RESULT PERSISTENCE (AUD-03 FIX: guaranteed update with error handling)
        logger.info(f"[{action_id}] Stage 4: Persisting result to ledger (AUD-03 compliant)...")
        
        try:
            await self.ledger.update_status(
                action_id,
                result.status.value,
                {
                    "platform_ref_id": result.platform_ref_id,
                    "error_message": result.error_message,
                    "executed_at": result.executed_at.isoformat(),
                    "metadata": result.metadata
                }
            )
            logger.info(f"[{action_id}] ✅ Result persisted successfully")
            
        except RuntimeError as e:
            # AUD-03: Database update failed - this is CRITICAL
            logger.critical(
                f"[{action_id}] CRITICAL DATABASE FAILURE: "
                f"Execution completed but status update failed: {e}"
            )
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "DatabasePersistenceFailure",
                    "message": "Execution completed but failed to persist result",
                    "action_id": action_id,
                    "audit_code": "AUD-03",
                    "critical": True
                }
            )
        
        logger.info(f"[{action_id}] 🚀 Secure execution pipeline completed successfully")
        return result
    
    async def get_execution_status(self, action_id: str) -> dict:
        """
        Query current execution status from ledger.
        
        Args:
            action_id: UUID of the action.
            
        Returns:
            dict: Status information.
        """
        # TODO: Implement status query from ledger
        logger.info(f"Status query for action {action_id}")
        return {"action_id": action_id, "status": "QUERY_NOT_IMPLEMENTED"}
