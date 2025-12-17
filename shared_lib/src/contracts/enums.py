"""
Enums for campaign states, quality verdicts, severity levels, and failure reasons.
"""

from enum import Enum


class CampaignState(str, Enum):
    """States in the campaign workflow."""
    IDLE = "IDLE"
    RADAR_SCAN = "RADAR_SCAN"
    STRATEGY_GEN = "STRATEGY_GEN"
    CONTENT_PROD = "CONTENT_PROD"
    QUALITY_AUDIT = "QUALITY_AUDIT"
    PUBLISH = "PUBLISH"
    LEARN = "LEARN"
    FAILED = "FAILED"


class QualityVerdict(str, Enum):
    """Quality check verdicts."""
    PASS = "PASS"
    FAIL = "FAIL"
    WARN = "WARN"


class Severity(str, Enum):
    """Severity levels for quality issues."""
    CRITICAL = "CRITICAL"  # Blocks publication
    HIGH = "HIGH"          # Requires human review
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class FailureReason(str, Enum):
    """Classified failure reasons for terminal states."""
    POLICY_VIOLATION = "FAILED_POLICY"
    QUALITY_CHECK_FAILED = "FAILED_QUALITY"
    CONTRACT_INVALID = "FAILED_CONTRACT"
    PLATFORM_ERROR = "FAILED_PLATFORM"
    TIMEOUT = "FAILED_TIMEOUT"
