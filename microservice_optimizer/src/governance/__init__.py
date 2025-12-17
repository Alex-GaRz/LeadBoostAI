"""
Governance Module - Brand Genome enforcement and quality auditing.

This module implements the "Judge of Iron" - the adversarial system
that validates campaigns against Brand Genome rules.

Usage:
    from governance import audit_campaign
    
    report = await audit_campaign(campaign_payload)
    if report.verdict == QualityVerdict.FAIL:
        # Block publication
        pass
"""

from .genome import (
    BrandGenome,
    ToneGuard,
    VisualGuard,
    RiskGuard,
    create_mock_genome,
)

from .engine import (
    AuditContext,
    GovernancePipeline,
    audit_campaign,
)

from .rules import (
    GovernanceRule,
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
)

__all__ = [
    # Genome models
    "BrandGenome",
    "ToneGuard",
    "VisualGuard",
    "RiskGuard",
    "create_mock_genome",
    # Engine
    "AuditContext",
    "GovernancePipeline",
    "audit_campaign",
    # Rules base
    "GovernanceRule",
    # Financial rules
    "BudgetCapRule",
    "CPABidRule",
    "ChannelAuthorizationRule",
    "ROITargetRule",
    # Content rules
    "KeywordBlacklistRule",
    "RequiredDisclaimerRule",
    "MessageLengthRule",
    "ToneVoiceRule",
]

__version__ = "1.0.0"
