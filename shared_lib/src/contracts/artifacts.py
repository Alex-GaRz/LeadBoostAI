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


# --- VISUAL EXECUTION (Phase 7) ---

class LayoutZone(BaseModel):
    """Defines a zone in the visual layout."""
    name: str
    x: int
    y: int
    width: int
    height: int
    z_index: int
    content_type: str  # E.g., "product", "text", "empty"
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "product_zone",
                "x": 100,
                "y": 100,
                "width": 800,
                "height": 800,
                "z_index": 1,
                "content_type": "product"
            }
        }


class LayoutPlan(BaseModel):
    """Complete layout plan for visual generation."""
    canvas_width: int
    canvas_height: int
    safe_margin_px: int
    zones: List[LayoutZone] = Field(default_factory=list)
    background_hex: Optional[str] = None
    composition_guide: str = "rule_of_thirds"
    
    class Config:
        json_schema_extra = {
            "example": {
                "canvas_width": 1080,
                "canvas_height": 1350,
                "safe_margin_px": 50,
                "zones": [
                    {
                        "name": "product_zone",
                        "x": 100,
                        "y": 100,
                        "width": 800,
                        "height": 800,
                        "z_index": 1,
                        "content_type": "product"
                    }
                ],
                "background_hex": "#FFFFFF",
                "composition_guide": "rule_of_thirds"
            }
        }


class VisualAsset(BaseModel):
    """Generated visual asset with metadata and quality metrics."""
    asset_id: UUID
    url: str
    layout_used: Optional[LayoutPlan] = None
    technical_metadata: Dict[str, Any] = Field(default_factory=dict)  # dpi, format, size_bytes
    generation_params: Dict[str, Any] = Field(default_factory=dict)  # seed, model_version, steps
    quality_score: float = Field(ge=0.0, le=1.0, default=0.0)
    critique_feedback: List[str] = Field(default_factory=list)
    
    class Config:
        json_schema_extra = {
            "example": {
                "asset_id": "550e8400-e29b-41d4-a716-446655440000",
                "url": "https://storage.example.com/assets/abc123.png",
                "layout_used": {
                    "canvas_width": 1080,
                    "canvas_height": 1350,
                    "safe_margin_px": 50,
                    "zones": [],
                    "background_hex": "#FFFFFF",
                    "composition_guide": "rule_of_thirds"
                },
                "technical_metadata": {"dpi": 72, "format": "png", "size_bytes": 524288},
                "generation_params": {"seed": 42, "model_version": "sdxl-1.0", "steps": 30},
                "quality_score": 0.85,
                "critique_feedback": ["Good contrast", "Well-composed"]
            }
        }


class CopyVariant(BaseModel):
    """Copy variant with tone analysis and risk assessment."""
    variant_id: UUID
    type: str  # E.g., "headline", "body", "full_ad"
    text_content: Dict[str, str] = Field(default_factory=dict)  # E.g., {"headline": "...", "body": "..."}
    tone_score: float = Field(ge=0.0, le=1.0, default=0.0)
    risk_flags: List[str] = Field(default_factory=list)
    rationale: str = ""
    
    class Config:
        json_schema_extra = {
            "example": {
                "variant_id": "660e8400-e29b-41d4-a716-446655440000",
                "type": "full_ad",
                "text_content": {
                    "headline": "Transform Your Business Today",
                    "body": "Discover innovative solutions that drive results.",
                    "cta": "Learn More"
                },
                "tone_score": 0.92,
                "risk_flags": [],
                "rationale": "Professional tone aligned with brand guidelines"
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


# --- CONTENT ASSEMBLY (Phase 7 - Block 5) ---

class ContentPackage(BaseModel):
    """Assembled content package ready for orchestration."""
    package_id: UUID
    visual_asset: VisualAsset
    copy_variant: CopyVariant
    assembly_metadata: Dict[str, Any] = Field(default_factory=dict)
    coherence_score: float = Field(ge=0.0, le=1.0, default=1.0)
    validation_checks: List[str] = Field(default_factory=list)
    
    class Config:
        json_schema_extra = {
            "example": {
                "package_id": "770e8400-e29b-41d4-a716-446655440000",
                "visual_asset": {
                    "asset_id": "550e8400-e29b-41d4-a716-446655440000",
                    "url": "https://storage.example.com/assets/abc123.png",
                    "quality_score": 0.85
                },
                "copy_variant": {
                    "variant_id": "660e8400-e29b-41d4-a716-446655440000",
                    "type": "full_ad",
                    "text_content": {"headline": "...", "body": "..."},
                    "tone_score": 0.92
                },
                "assembly_metadata": {
                    "layout_id_match": True,
                    "visual_asset_id_match": True
                },
                "coherence_score": 0.95,
                "validation_checks": ["layout_coherence", "id_consistency"]
            }
        }


class ContentFailureReport(BaseModel):
    """Failure report for content assembly."""
    reason_code: str
    severity: Severity
    evidence: Dict[str, Any] = Field(default_factory=dict)
    failed_checks: List[str] = Field(default_factory=list)
    
    class Config:
        json_schema_extra = {
            "example": {
                "reason_code": "LAYOUT_MISMATCH",
                "severity": "CRITICAL",
                "evidence": {
                    "visual_layout_id": "abc123",
                    "copy_layout_id": "xyz789",
                    "mismatch_detected": True
                },
                "failed_checks": ["layout_id_consistency"]
            }
        }
