"""
Financial Governance Rules - Budget and ROI controls.

These rules enforce financial constraints defined in the Brand Genome.
They ensure campaigns stay within budget limits and meet ROI targets.
"""

import logging
from typing import Dict, Any

# Import from shared_lib contracts
from contracts import QualityCheck, Severity

# Import local types
from ..engine.context import AuditContext
from .base import GovernanceRule

logger = logging.getLogger(__name__)


class BudgetCapRule(GovernanceRule):
    """
    Rule: FIN_001 - Budget Cap Enforcement
    
    Validates that the proposed campaign budget does not exceed
    the maximum daily budget defined in the Brand Genome.
    
    Severity: CRITICAL - Budget overruns are not acceptable.
    """
    
    rule_id = "FIN_001_BUDGET_CAP"
    severity = Severity.CRITICAL
    
    async def evaluate(self, ctx: AuditContext) -> QualityCheck:
        """
        Evaluate budget against genome limits.
        
        Args:
            ctx: AuditContext with payload and genome
            
        Returns:
            PASS if budget within limits, FAIL if exceeded
        """
        # Check if strategy exists
        if not ctx.has_strategy():
            return self.fail_check(
                reason="NO_STRATEGY_DEFINED",
                evidence={"message": "Cannot validate budget without strategy"}
            )
        
        # Get proposed budget
        proposed_budget = ctx.get_total_budget()
        
        # Get limit from genome
        max_allowed = ctx.genome.risk.max_daily_budget
        
        # Log for audit trail
        logger.info(
            f"[{self.rule_id}] Validating budget: "
            f"proposed={proposed_budget:.2f}, limit={max_allowed:.2f}"
        )
        
        # Check if within limits
        if proposed_budget > max_allowed:
            overage = proposed_budget - max_allowed
            overage_pct = (overage / max_allowed) * 100
            
            return self.fail_check(
                reason="BUDGET_EXCEEDS_LIMIT",
                evidence={
                    "proposed_budget": proposed_budget,
                    "max_allowed_budget": max_allowed,
                    "overage_amount": overage,
                    "overage_percentage": round(overage_pct, 2),
                    "message": f"Budget exceeds limit by ${overage:.2f} ({overage_pct:.1f}%)"
                }
            )
        
        # Budget is acceptable
        utilization = (proposed_budget / max_allowed) * 100
        return self.pass_check(
            evidence={
                "proposed_budget": proposed_budget,
                "max_allowed_budget": max_allowed,
                "remaining_budget": max_allowed - proposed_budget,
                "utilization_percentage": round(utilization, 2),
                "message": f"Budget within limits ({utilization:.1f}% utilization)"
            }
        )


class CPABidRule(GovernanceRule):
    """
    Rule: FIN_002 - Cost-Per-Acquisition Bid Limit
    
    Validates that CPA bids don't exceed the maximum allowed.
    This prevents overpaying for conversions.
    
    Severity: HIGH - Important for profitability but not blocking.
    """
    
    rule_id = "FIN_002_CPA_BID_LIMIT"
    severity = Severity.HIGH
    
    async def evaluate(self, ctx: AuditContext) -> QualityCheck:
        """
        Evaluate CPA bid against genome limits.
        
        Note: This is a simplified implementation. Real-world would
        check actual bid amounts from platform configurations.
        
        Args:
            ctx: AuditContext
            
        Returns:
            PASS if CPA bid is reasonable, FAIL if too high
        """
        # Check if strategy exists
        if not ctx.has_strategy():
            return self.fail_check(
                reason="NO_STRATEGY_DEFINED",
                evidence={"message": "Cannot validate CPA without strategy"}
            )
        
        # For now, we'll validate based on budget allocation
        # In production, this would check actual bid configurations
        max_cpa = ctx.genome.risk.max_cpa_bid
        proposed_budget = ctx.get_total_budget()
        
        # Simple heuristic: If budget is very high, warn about potential CPA issues
        # This is a placeholder - real implementation would check actual bids
        budget_per_channel = proposed_budget / max(len(ctx.get_channels()), 1)
        
        if budget_per_channel > (max_cpa * 100):  # Rough check
            return self.warn_check(
                reason="HIGH_BUDGET_MAY_INDICATE_HIGH_CPA",
                evidence={
                    "max_cpa_limit": max_cpa,
                    "budget_per_channel": budget_per_channel,
                    "message": "High budget allocation may lead to CPA overspending"
                }
            )
        
        return self.pass_check(
            evidence={
                "max_cpa_limit": max_cpa,
                "message": "CPA bid expectations within limits"
            }
        )


class ChannelAuthorizationRule(GovernanceRule):
    """
    Rule: FIN_003 - Channel Authorization
    
    Validates that all selected channels are authorized in the Brand Genome.
    
    Severity: CRITICAL - Unauthorized channels are not allowed.
    """
    
    rule_id = "FIN_003_CHANNEL_AUTHORIZATION"
    severity = Severity.CRITICAL
    
    async def evaluate(self, ctx: AuditContext) -> QualityCheck:
        """
        Verify all channels are authorized.
        
        Args:
            ctx: AuditContext
            
        Returns:
            PASS if all channels authorized, FAIL if any unauthorized
        """
        # Check if strategy exists
        if not ctx.has_strategy():
            return self.fail_check(
                reason="NO_STRATEGY_DEFINED",
                evidence={"message": "Cannot validate channels without strategy"}
            )
        
        # Get channels
        proposed_channels = [ch.upper() for ch in ctx.get_channels()]
        authorized_channels = [ch.upper() for ch in ctx.genome.risk.authorized_channels]
        
        # Check for unauthorized channels
        unauthorized = [ch for ch in proposed_channels if ch not in authorized_channels]
        
        logger.info(
            f"[{self.rule_id}] Checking channels: "
            f"proposed={proposed_channels}, authorized={authorized_channels}"
        )
        
        if unauthorized:
            return self.fail_check(
                reason="UNAUTHORIZED_CHANNELS",
                evidence={
                    "proposed_channels": proposed_channels,
                    "authorized_channels": authorized_channels,
                    "unauthorized_channels": unauthorized,
                    "message": f"Unauthorized channels detected: {', '.join(unauthorized)}"
                }
            )
        
        # All channels authorized
        return self.pass_check(
            evidence={
                "proposed_channels": proposed_channels,
                "authorized_channels": authorized_channels,
                "message": f"All {len(proposed_channels)} channel(s) authorized"
            }
        )


class ROITargetRule(GovernanceRule):
    """
    Rule: FIN_004 - ROI Target Validation
    
    Validates that the campaign has potential to meet minimum ROI targets.
    This is a predictive check based on historical data.
    
    Severity: MEDIUM - Advisory, not blocking.
    """
    
    rule_id = "FIN_004_ROI_TARGET"
    severity = Severity.MEDIUM
    
    async def evaluate(self, ctx: AuditContext) -> QualityCheck:
        """
        Check if ROI target is defined and reasonable.
        
        Note: This is a simplified implementation. Real-world would
        use ML models to predict ROI based on campaign parameters.
        
        Args:
            ctx: AuditContext
            
        Returns:
            PASS if ROI target is reasonable, WARN if concerns
        """
        # Check if ROI target is defined in genome
        min_roi = ctx.genome.risk.min_roi_target
        
        if min_roi is None:
            # No ROI target defined, skip this rule
            return self.pass_check(
                evidence={
                    "message": "No ROI target defined in genome",
                    "skipped": True
                }
            )
        
        # In production, this would:
        # 1. Analyze historical performance
        # 2. Use ML to predict ROI
        # 3. Compare against target
        
        # For now, just validate that a strategy exists
        if not ctx.has_strategy():
            return self.warn_check(
                reason="NO_STRATEGY_FOR_ROI_PREDICTION",
                evidence={
                    "min_roi_target": min_roi,
                    "message": "Cannot predict ROI without strategy"
                }
            )
        
        # Placeholder: In real implementation, would check predicted ROI
        return self.pass_check(
            evidence={
                "min_roi_target": min_roi,
                "message": f"ROI target validation skipped (min target: {min_roi}x)",
                "note": "Production implementation would use ML prediction"
            }
        )
