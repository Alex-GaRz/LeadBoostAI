"""
Business artifacts: StrategyBrief and QualityReport (Enterprise Grade).
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from uuid import UUID, uuid4
from .enums import QualityVerdict, Severity


# --- QUALITY (Enterprise Grade) ---

class QualityCheck(BaseModel):
    """Individual quality check result."""
    check_id: str               # E.g., "contrast_ratio_check"
    result: QualityVerdict      # PASS / FAIL / WARN
    reason_code: Optional[str] = None  # E.g., "CONTRAST_TOO_LOW"
    severity: Severity          # CRITICAL, HIGH, MEDIUM, LOW
    evidence: Dict[str, Any] = Field(default_factory=dict)  # E.g., {"actual": 3.1, "min_required": 4.5}
    
    class Config:
        json_schema_extra = {
            "example": {
                "check_id": "contrast_ratio_check",
                "result": "FAIL",
                "reason_code": "CONTRAST_TOO_LOW",
                "severity": "CRITICAL",
                "evidence": {"actual": 3.1, "min_required": 4.5}
            }
        }


class QualityReport(BaseModel):
    """Complete quality audit report."""
    verdict: QualityVerdict
    checks: List[QualityCheck] = Field(default_factory=list)
    auditor_signature: str      # Hash of the audit service
    timestamp: float
    
    class Config:
        json_schema_extra = {
            "example": {
                "verdict": "FAIL",
                "checks": [
                    {
                        "check_id": "contrast_ratio_check",
                        "result": "FAIL",
                        "reason_code": "CONTRAST_TOO_LOW",
                        "severity": "CRITICAL",
                        "evidence": {"actual": 3.1, "min_required": 4.5}
                    }
                ],
                "auditor_signature": "sha256:abc123...",
                "timestamp": 1702843200.0
            }
        }


# --- STRATEGY (Enriched with Context) ---

class StrategyBrief(BaseModel):
    """Strategy brief with constraints and guidelines."""
    brief_id: UUID = Field(default_factory=uuid4)
    target_audience: str
    core_message: str
    channels: List[str] = Field(default_factory=list)
    budget_allocation: Dict[str, float] = Field(default_factory=dict)
    
    # New mandatory fields
    do_not_do: List[str] = Field(default_factory=list)  # E.g., ["No usar rojo", "No mencionar política"]
    tone_guard: Dict[str, str] = Field(default_factory=dict)  # E.g., {"voice": "formal", "style": "minimal"}
    platform_constraints: Dict[str, Any] = Field(default_factory=dict)  # E.g., {"meta": {"aspect_ratio": "4:5"}}
    
    class Config:
        json_schema_extra = {
            "example": {
                "brief_id": "550e8400-e29b-41d4-a716-446655440000",
                "target_audience": "Tech professionals 25-40",
                "core_message": "Innovation drives success",
                "channels": ["meta", "linkedin", "twitter"],
                "budget_allocation": {"meta": 0.5, "linkedin": 0.3, "twitter": 0.2},
                "do_not_do": ["No usar rojo", "No mencionar política"],
                "tone_guard": {"voice": "formal", "style": "minimal"},
                "platform_constraints": {"meta": {"aspect_ratio": "4:5"}}
            }
        }
