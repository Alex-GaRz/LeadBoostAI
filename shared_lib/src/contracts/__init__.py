"""
LeadBoostAI Contracts Library
Shared data contracts for Phoenix V5 orchestration.
"""

from .enums import CampaignState, QualityVerdict, Severity, FailureReason
from .artifacts import QualityCheck, QualityReport, StrategyBrief
from .payload import TraceEntry, CampaignPayload

__all__ = [
    "CampaignState",
    "QualityVerdict",
    "Severity",
    "FailureReason",
    "QualityCheck",
    "QualityReport",
    "StrategyBrief",
    "TraceEntry",
    "CampaignPayload",
]

__version__ = "1.0.0"
