"""
Governance Pipeline - Orchestrator for rule execution.

The pipeline coordinates the execution of all governance rules,
aggregates results, and produces a final QualityReport.

PRINCIPLE: "The Judge of Iron"
Everything is forbidden unless explicitly allowed by passing ALL critical rules.
"""

import asyncio
import logging
import time
from typing import List, Type
from uuid import UUID

# Import from shared_lib contracts
from contracts import (
    CampaignPayload,
    QualityReport,
    QualityCheck,
    QualityVerdict,
    Severity,
)

# Import local types
from ..genome.models import BrandGenome, create_mock_genome
from ..engine.context import AuditContext
from ..rules.base import GovernanceRule

# Import concrete rules
from ..rules.financial import (
    BudgetCapRule,
    CPABidRule,
    ChannelAuthorizationRule,
    ROITargetRule,
)
from ..rules.content import (
    KeywordBlacklistRule,
    RequiredDisclaimerRule,
    MessageLengthRule,
    ToneVoiceRule,
)

logger = logging.getLogger(__name__)


class GovernancePipeline:
    """
    Orchestrator for governance rule execution.
    
    Responsibilities:
    1. Load Brand Genome for tenant
    2. Build AuditContext
    3. Execute all rules in parallel
    4. Aggregate results
    5. Produce final QualityReport
    """
    
    # Default rule set (can be overridden)
    DEFAULT_RULES: List[Type[GovernanceRule]] = [
        # Financial rules
        BudgetCapRule,
        CPABidRule,
        ChannelAuthorizationRule,
        ROITargetRule,
        # Content rules
        KeywordBlacklistRule,
        RequiredDisclaimerRule,
        MessageLengthRule,
        ToneVoiceRule,
    ]
    
    def __init__(self, rules: List[Type[GovernanceRule]] = None):
        """
        Initialize the pipeline.
        
        Args:
            rules: Optional list of rule classes to use. If None, uses DEFAULT_RULES.
        """
        self.rule_classes = rules or self.DEFAULT_RULES
        self.rules = [rule_class() for rule_class in self.rule_classes]
        
        logger.info(
            f"GovernancePipeline initialized with {len(self.rules)} rules: "
            f"{[r.rule_id for r in self.rules]}"
        )
    
    async def load_genome(self, tenant_id: UUID) -> BrandGenome:
        """
        Load the Brand Genome for a tenant.
        
        NOTE: This is a MOCK implementation. In production, this would:
        1. Query a database (PostgreSQL, MongoDB)
        2. Load from a cache (Redis)
        3. Fetch from a configuration service
        
        Args:
            tenant_id: Tenant UUID
            
        Returns:
            BrandGenome for the tenant
        """
        logger.info(f"Loading Brand Genome for tenant {tenant_id}")
        
        # MOCK: Return a hardcoded genome
        # In production, replace with actual database query
        genome = create_mock_genome(tenant_id, "MockBrand")
        
        # Override with more realistic values for testing
        genome.tone.forbidden_words = ["spam", "scam", "fake", "cheap"]
        genome.tone.required_disclaimers = ["Terms apply."]
        genome.visual.min_contrast_ratio = 4.5
        genome.risk.max_daily_budget = 1000.00
        genome.risk.max_cpa_bid = 50.00
        genome.risk.authorized_channels = ["META", "GOOGLE", "LINKEDIN"]
        
        logger.info(
            f"Loaded genome for {genome.brand_name}: "
            f"budget_cap=${genome.risk.max_daily_budget}, "
            f"forbidden_words={len(genome.tone.forbidden_words)}"
        )
        
        return genome
    
    def build_context(
        self,
        payload: CampaignPayload,
        genome: BrandGenome
    ) -> AuditContext:
        """
        Build an AuditContext from payload and genome.
        
        Args:
            payload: CampaignPayload being audited
            genome: BrandGenome with rules
            
        Returns:
            AuditContext ready for rule evaluation
        """
        # Extract assets from payload
        assets = payload.assets if payload.assets else []
        
        # Build context
        ctx = AuditContext(
            payload=payload,
            genome=genome,
            assets=assets,
            metadata={
                "pipeline_version": "1.0",
                "timestamp": time.time(),
            }
        )
        
        logger.debug(
            f"Built AuditContext: campaign={payload.campaign_id}, "
            f"has_strategy={ctx.has_strategy()}, "
            f"assets={len(assets)}"
        )
        
        return ctx
    
    async def execute_rules(self, ctx: AuditContext) -> List[QualityCheck]:
        """
        Execute all rules in parallel.
        
        Args:
            ctx: AuditContext
            
        Returns:
            List of QualityCheck results
        """
        logger.info(f"Executing {len(self.rules)} governance rules...")
        
        start_time = time.time()
        
        # Execute all rules concurrently using asyncio.gather
        # Use safe_evaluate to catch any unexpected exceptions
        tasks = [rule.safe_evaluate(ctx) for rule in self.rules]
        checks = await asyncio.gather(*tasks, return_exceptions=False)
        
        execution_time = time.time() - start_time
        
        # Log results summary
        pass_count = sum(1 for c in checks if c.result == QualityVerdict.PASS)
        fail_count = sum(1 for c in checks if c.result == QualityVerdict.FAIL)
        warn_count = sum(1 for c in checks if c.result == QualityVerdict.WARN)
        
        logger.info(
            f"Rules executed in {execution_time:.2f}s: "
            f"{pass_count} PASS, {fail_count} FAIL, {warn_count} WARN"
        )
        
        return checks
    
    def aggregate_verdict(self, checks: List[QualityCheck]) -> QualityVerdict:
        """
        Determine final verdict from individual checks.
        
        Logic:
        - If ANY CRITICAL check fails → FAIL
        - If ANY HIGH/MEDIUM check fails (no CRITICAL fails) → WARN
        - If all checks pass → PASS
        
        Args:
            checks: List of QualityCheck results
            
        Returns:
            Final QualityVerdict
        """
        # Check for CRITICAL failures
        critical_failures = [
            c for c in checks
            if c.result == QualityVerdict.FAIL and c.severity == Severity.CRITICAL
        ]
        
        if critical_failures:
            logger.warning(
                f"CRITICAL failures detected: "
                f"{[c.check_id for c in critical_failures]}"
            )
            return QualityVerdict.FAIL
        
        # Check for any failures (HIGH or lower)
        any_failures = [c for c in checks if c.result == QualityVerdict.FAIL]
        
        if any_failures:
            logger.warning(
                f"Non-critical failures detected: "
                f"{[c.check_id for c in any_failures]}"
            )
            return QualityVerdict.WARN
        
        # Check for warnings
        any_warnings = [c for c in checks if c.result == QualityVerdict.WARN]
        
        if any_warnings:
            logger.info(
                f"Warnings detected: "
                f"{[c.check_id for c in any_warnings]}"
            )
            return QualityVerdict.WARN
        
        # All checks passed
        logger.info("All checks passed")
        return QualityVerdict.PASS
    
    async def execute_audit(self, payload: CampaignPayload) -> QualityReport:
        """
        Execute the full governance audit pipeline.
        
        This is the main entry point for governance validation.
        
        Args:
            payload: CampaignPayload to audit
            
        Returns:
            QualityReport with verdict and all check results
        """
        logger.info(
            f"Starting governance audit for campaign {payload.campaign_id}"
        )
        
        start_time = time.time()
        
        try:
            # 1. Load Brand Genome
            genome = await self.load_genome(payload.tenant_id)
            
            # 2. Build AuditContext
            ctx = self.build_context(payload, genome)
            
            # 3. Execute all rules
            checks = await self.execute_rules(ctx)
            
            # 4. Aggregate verdict
            final_verdict = self.aggregate_verdict(checks)
            
            # 5. Build QualityReport
            report = QualityReport(
                verdict=final_verdict,
                checks=checks,
                auditor_signature=f"governance_pipeline_v1.0_{genome.version}",
                timestamp=time.time()
            )
            
            execution_time = time.time() - start_time
            
            logger.info(
                f"Audit completed in {execution_time:.2f}s: "
                f"verdict={final_verdict.value}, "
                f"checks={len(checks)}"
            )
            
            return report
            
        except Exception as e:
            # If something goes wrong in the pipeline itself, return a FAIL report
            logger.exception(f"Audit pipeline failed: {str(e)}")
            
            # Create an error check
            error_check = QualityCheck(
                check_id="PIPELINE_ERROR",
                result=QualityVerdict.FAIL,
                reason_code="AUDIT_PIPELINE_FAILURE",
                severity=Severity.CRITICAL,
                evidence={
                    "error": str(e),
                    "error_type": type(e).__name__
                }
            )
            
            return QualityReport(
                verdict=QualityVerdict.FAIL,
                checks=[error_check],
                auditor_signature="governance_pipeline_v1.0_ERROR",
                timestamp=time.time()
            )


# Convenience function for quick audits
async def audit_campaign(payload: CampaignPayload) -> QualityReport:
    """
    Convenience function to audit a campaign with default rules.
    
    Args:
        payload: CampaignPayload to audit
        
    Returns:
        QualityReport
    """
    pipeline = GovernancePipeline()
    return await pipeline.execute_audit(payload)
