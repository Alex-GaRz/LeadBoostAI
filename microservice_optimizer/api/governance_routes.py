"""
Governance Engine API Routes
FastAPI router exposing Brand Genome validation endpoints.
"""

import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse

# Import shared contracts
from contracts import CampaignPayload, QualityReport, QualityVerdict

# Import governance engine
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from governance import GovernancePipeline, audit_campaign

logger = logging.getLogger(__name__)

# Create API router
router = APIRouter(
    prefix="/api/v1",
    tags=["governance"],
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal server error"},
    },
)


@router.post(
    "/audit-quality",
    response_model=QualityReport,
    status_code=status.HTTP_200_OK,
    summary="Audit Campaign Quality",
    description="""
    Perform comprehensive Brand Genome validation on a campaign.
    
    This endpoint executes all governance rules (financial, content, visual)
    against the provided campaign payload. The audit includes:
    
    - Budget validation (FIN_001, FIN_002)
    - Channel authorization (FIN_003)
    - ROI target compliance (FIN_004)
    - Keyword blacklist checking (TXT_001)
    - Disclaimer validation (TXT_002)
    - Message length limits (TXT_003)
    - Tone/voice compliance (TXT_004)
    
    **Returns**: QualityReport with verdict (PASS/WARN/FAIL) and detailed checks.
    
    **Behavior**:
    - PASS: All rules passed → Campaign approved for publication
    - WARN: Some non-critical issues → Review recommended
    - FAIL: Critical violations detected → Campaign BLOCKED
    """,
)
async def audit_quality(payload: CampaignPayload) -> QualityReport:
    """
    Execute governance audit on campaign payload.
    
    Args:
        payload: Complete CampaignPayload with strategy, assets, execution_log
        
    Returns:
        QualityReport with verdict and individual check results
        
    Raises:
        HTTPException: If audit execution fails
    """
    try:
        logger.info(
            f"Audit request received for campaign {payload.campaign_id} "
            f"(execution_id: {payload.execution_id})"
        )
        
        # Validate payload has required fields
        if not payload.strategy:
            logger.warning(f"Campaign {payload.campaign_id} has no strategy - audit may be incomplete")
        
        if not payload.assets:
            logger.warning(f"Campaign {payload.campaign_id} has no assets - skipping visual checks")
        
        # Execute governance pipeline
        report = await audit_campaign(payload)
        
        # Log audit results
        logger.info(
            f"Audit completed for campaign {payload.campaign_id}: "
            f"verdict={report.verdict.value}, "
            f"checks_run={len(report.checks)}, "
            f"failed_checks={sum(1 for c in report.checks if c.result == QualityVerdict.FAIL)}"
        )
        
        # Return the report
        return report
        
    except ValueError as e:
        # Invalid payload data
        logger.error(f"Invalid payload for campaign {payload.campaign_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid campaign data: {str(e)}"
        )
        
    except Exception as e:
        # Unexpected error during audit
        logger.error(
            f"Audit failed for campaign {payload.campaign_id}: {str(e)}",
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audit execution failed: {str(e)}"
        )


@router.post(
    "/audit-custom",
    response_model=QualityReport,
    status_code=status.HTTP_200_OK,
    summary="Custom Rule Audit",
    description="""
    Execute audit with a custom subset of governance rules.
    
    Useful for testing specific rules or running partial audits.
    """,
)
async def audit_custom(
    payload: CampaignPayload,
    rule_ids: list[str] = None
) -> QualityReport:
    """
    Execute custom governance audit with selected rules.
    
    Args:
        payload: Complete CampaignPayload
        rule_ids: Optional list of rule IDs to run (e.g., ["FIN_001", "TXT_001"])
        
    Returns:
        QualityReport with results from selected rules only
    """
    try:
        from governance.rules import (
            BudgetCapRule,
            CPABidRule,
            ChannelAuthorizationRule,
            ROITargetRule,
            KeywordBlacklistRule,
            RequiredDisclaimerRule,
            MessageLengthRule,
            ToneVoiceRule,
        )
        
        # Map rule IDs to classes
        RULE_MAP = {
            "FIN_001": BudgetCapRule,
            "FIN_002": CPABidRule,
            "FIN_003": ChannelAuthorizationRule,
            "FIN_004": ROITargetRule,
            "TXT_001": KeywordBlacklistRule,
            "TXT_002": RequiredDisclaimerRule,
            "TXT_003": MessageLengthRule,
            "TXT_004": ToneVoiceRule,
        }
        
        # Select rules
        if rule_ids:
            selected_rules = [RULE_MAP[rid] for rid in rule_ids if rid in RULE_MAP]
            logger.info(f"Custom audit with {len(selected_rules)} rules: {rule_ids}")
        else:
            selected_rules = list(RULE_MAP.values())
            logger.info("Custom audit with all rules (no filter provided)")
        
        # Create custom pipeline
        pipeline = GovernancePipeline(rules=selected_rules)
        report = await pipeline.execute_audit(payload)
        
        logger.info(
            f"Custom audit completed for campaign {payload.campaign_id}: "
            f"verdict={report.verdict.value}"
        )
        
        return report
        
    except KeyError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid rule_id: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Custom audit failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Custom audit failed: {str(e)}"
        )


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Governance Engine Health Check",
)
async def health_check() -> Dict[str, Any]:
    """
    Check if governance engine is operational.
    
    Returns:
        Status information about the governance engine
    """
    try:
        # Quick validation that imports work
        from governance import BrandGenome, GovernancePipeline
        
        return {
            "status": "healthy",
            "service": "governance_engine",
            "version": "1.0.0",
            "capabilities": {
                "financial_rules": 4,
                "content_rules": 4,
                "visual_rules": 0,  # Phase 5.4
                "total_rules": 8,
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "error": str(e)
            }
        )
