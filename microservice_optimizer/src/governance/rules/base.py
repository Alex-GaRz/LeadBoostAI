"""
Governance Rule Base Class - Abstract interface for all governance rules.

All governance rules must inherit from GovernanceRule and implement
the evaluate() method. This ensures consistency and testability.

PRINCIPLE: "The Judge of Iron"
Rules do not suggest - they judge. They return PASS or FAIL.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any
import logging

# Import from shared_lib contracts
from contracts import QualityCheck, QualityVerdict, Severity

# Import local types
from ..engine.context import AuditContext

logger = logging.getLogger(__name__)


class GovernanceRule(ABC):
    """
    Abstract base class for all governance rules.
    
    Each rule is:
    - Atomic: Tests one specific aspect
    - Isolated: No dependencies on other rules
    - Deterministic: Same input = same output (for non-LLM rules)
    - Safe: Never throws exceptions, always returns a QualityCheck
    """
    
    # Must be overridden by subclasses
    rule_id: str = "BASE_RULE"
    severity: Severity = Severity.MEDIUM
    
    def __init__(self):
        """Initialize the rule."""
        if self.rule_id == "BASE_RULE":
            logger.warning(
                f"{self.__class__.__name__} should override 'rule_id' class attribute"
            )
    
    @abstractmethod
    async def evaluate(self, ctx: AuditContext) -> QualityCheck:
        """
        Evaluate the rule against the audit context.
        
        CRITICAL: This method MUST NOT raise exceptions.
        If something goes wrong, return a FAIL check with evidence.
        
        Args:
            ctx: AuditContext containing all data needed for evaluation
            
        Returns:
            QualityCheck with PASS/FAIL verdict and evidence
        """
        pass
    
    # ============================================================
    # HELPER METHODS - Use these to create QualityCheck objects
    # ============================================================
    
    def pass_check(self, evidence: Dict[str, Any] = None) -> QualityCheck:
        """
        Create a PASS quality check.
        
        Args:
            evidence: Optional dictionary with supporting data
            
        Returns:
            QualityCheck with PASS verdict
        """
        return QualityCheck(
            check_id=self.rule_id,
            result=QualityVerdict.PASS,
            severity=self.severity,
            evidence=evidence or {}
        )
    
    def fail_check(
        self,
        reason: str,
        evidence: Dict[str, Any] = None
    ) -> QualityCheck:
        """
        Create a FAIL quality check.
        
        Args:
            reason: Human-readable reason code (e.g., "BUDGET_EXCEEDS_LIMIT")
            evidence: Optional dictionary with supporting data
            
        Returns:
            QualityCheck with FAIL verdict
        """
        return QualityCheck(
            check_id=self.rule_id,
            result=QualityVerdict.FAIL,
            reason_code=reason,
            severity=self.severity,
            evidence=evidence or {}
        )
    
    def warn_check(
        self,
        reason: str,
        evidence: Dict[str, Any] = None
    ) -> QualityCheck:
        """
        Create a WARN quality check.
        
        Warnings indicate potential issues that don't block publication
        but should be reviewed.
        
        Args:
            reason: Human-readable reason code
            evidence: Optional dictionary with supporting data
            
        Returns:
            QualityCheck with WARN verdict
        """
        return QualityCheck(
            check_id=self.rule_id,
            result=QualityVerdict.WARN,
            reason_code=reason,
            severity=self.severity,
            evidence=evidence or {}
        )
    
    def error_check(self, error_message: str) -> QualityCheck:
        """
        Create a FAIL check due to an internal error.
        
        Use this when the rule itself encounters an error during evaluation.
        This should be rare - rules should handle expected errors gracefully.
        
        Args:
            error_message: Error description
            
        Returns:
            QualityCheck with FAIL verdict and error evidence
        """
        logger.error(f"Rule {self.rule_id} encountered error: {error_message}")
        return QualityCheck(
            check_id=self.rule_id,
            result=QualityVerdict.FAIL,
            reason_code="INTERNAL_RULE_ERROR",
            severity=Severity.HIGH,  # Internal errors are always HIGH severity
            evidence={
                "error": error_message,
                "rule_class": self.__class__.__name__
            }
        )
    
    # ============================================================
    # UTILITY METHODS
    # ============================================================
    
    def __str__(self) -> str:
        """String representation of the rule."""
        return f"{self.__class__.__name__}(rule_id={self.rule_id}, severity={self.severity.value})"
    
    def __repr__(self) -> str:
        """Developer-friendly representation."""
        return self.__str__()
    
    async def safe_evaluate(self, ctx: AuditContext) -> QualityCheck:
        """
        Wrapper around evaluate() that catches unexpected exceptions.
        
        This ensures that a buggy rule never crashes the entire audit pipeline.
        
        Args:
            ctx: AuditContext
            
        Returns:
            QualityCheck (error check if exception occurs)
        """
        try:
            return await self.evaluate(ctx)
        except Exception as e:
            logger.exception(
                f"Unexpected exception in rule {self.rule_id}: {str(e)}"
            )
            return self.error_check(f"Unexpected exception: {str(e)}")


class SkippedRule(GovernanceRule):
    """
    Special rule that always returns PASS.
    
    Used for rules that are not yet implemented or disabled.
    """
    
    rule_id = "SKIPPED_RULE"
    severity = Severity.LOW
    
    def __init__(self, rule_id: str, reason: str = "Not implemented"):
        super().__init__()
        self.rule_id = rule_id
        self.skip_reason = reason
    
    async def evaluate(self, ctx: AuditContext) -> QualityCheck:
        """Always returns PASS with skip reason."""
        return self.pass_check(evidence={"skipped": True, "reason": self.skip_reason})
