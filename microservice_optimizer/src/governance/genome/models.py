"""
Brand Genome Models - Configuration schema for tenant-specific governance rules.

The Brand Genome defines the "Law" for each client - what is allowed and what is forbidden.
This is the source of truth for all governance decisions.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from uuid import UUID


class ToneGuard(BaseModel):
    """
    Tone and voice guidelines for content.
    Defines how the brand should communicate.
    """
    voice_description: str = Field(
        ...,
        description="Natural language description of the brand voice",
        examples=["Professional, witty, but never sarcastic"]
    )
    forbidden_words: List[str] = Field(
        default_factory=list,
        description="Words that must never appear in content"
    )
    required_disclaimers: List[str] = Field(
        default_factory=list,
        description="Legal disclaimers that must be included"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "voice_description": "Inspirational, athletic, direct. Use action verbs.",
                "forbidden_words": ["cheap", "discount", "free"],
                "required_disclaimers": ["Terms apply."]
            }
        }


class VisualGuard(BaseModel):
    """
    Visual identity guidelines.
    Defines color palette, contrast requirements, and branding rules.
    """
    allowed_hex_colors: List[str] = Field(
        default_factory=list,
        description="Approved color palette in HEX format"
    )
    min_contrast_ratio: float = Field(
        default=4.5,
        ge=1.0,
        le=21.0,
        description="Minimum WCAG contrast ratio (4.5 for AA, 7.0 for AAA)"
    )
    logo_mandatory: bool = Field(
        default=True,
        description="Whether logo must appear in all assets"
    )
    safe_zone_px: Optional[int] = Field(
        default=None,
        description="Minimum safe zone around logo in pixels"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "allowed_hex_colors": ["#000000", "#FFFFFF", "#FF0000"],
                "min_contrast_ratio": 4.5,
                "logo_mandatory": True,
                "safe_zone_px": 20
            }
        }


class RiskGuard(BaseModel):
    """
    Financial and operational risk controls.
    Defines budget limits, approved channels, and bidding constraints.
    """
    max_daily_budget: float = Field(
        ...,
        gt=0.0,
        description="Maximum daily spend allowed"
    )
    max_cpa_bid: float = Field(
        ...,
        gt=0.0,
        description="Maximum cost-per-acquisition bid"
    )
    authorized_channels: List[str] = Field(
        default_factory=list,
        description="List of approved advertising channels (e.g., META, GOOGLE)"
    )
    min_roi_target: Optional[float] = Field(
        default=None,
        ge=0.0,
        description="Minimum ROI target (e.g., 2.0 means 2x return)"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "max_daily_budget": 500.00,
                "max_cpa_bid": 15.00,
                "authorized_channels": ["META", "GOOGLE"],
                "min_roi_target": 2.5
            }
        }


class BrandGenome(BaseModel):
    """
    Complete Brand Genome - the constitutional document for a tenant.
    
    This model defines ALL governance rules for a specific client.
    Everything is forbidden unless explicitly allowed by this genome.
    """
    tenant_id: UUID = Field(
        ...,
        description="Unique identifier for the tenant/client"
    )
    brand_name: str = Field(
        ...,
        description="Brand name for logging and display"
    )
    tone: ToneGuard = Field(
        ...,
        description="Content tone and voice guidelines"
    )
    visual: VisualGuard = Field(
        ...,
        description="Visual identity guidelines"
    )
    risk: RiskGuard = Field(
        ...,
        description="Financial and operational risk controls"
    )
    version: str = Field(
        default="1.0",
        description="Genome version for tracking changes"
    )
    active: bool = Field(
        default=True,
        description="Whether this genome is currently active"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
                "brand_name": "Nike",
                "tone": {
                    "voice_description": "Inspirational, athletic, direct. Use action verbs.",
                    "forbidden_words": ["cheap", "discount", "free"],
                    "required_disclaimers": ["Terms apply."]
                },
                "visual": {
                    "allowed_hex_colors": ["#000000", "#FFFFFF", "#FF0000"],
                    "min_contrast_ratio": 4.5,
                    "logo_mandatory": True
                },
                "risk": {
                    "max_daily_budget": 500.00,
                    "max_cpa_bid": 15.00,
                    "authorized_channels": ["META", "GOOGLE"]
                },
                "version": "1.0",
                "active": True
            }
        }


# Factory function for creating mock genomes in tests
def create_mock_genome(tenant_id: UUID, brand_name: str = "TestBrand") -> BrandGenome:
    """
    Create a mock BrandGenome for testing purposes.
    
    Args:
        tenant_id: Tenant UUID
        brand_name: Brand name (default: "TestBrand")
        
    Returns:
        A BrandGenome with reasonable defaults
    """
    return BrandGenome(
        tenant_id=tenant_id,
        brand_name=brand_name,
        tone=ToneGuard(
            voice_description="Professional and friendly",
            forbidden_words=["spam", "scam", "fake"],
            required_disclaimers=[]
        ),
        visual=VisualGuard(
            allowed_hex_colors=["#000000", "#FFFFFF"],
            min_contrast_ratio=4.5,
            logo_mandatory=False
        ),
        risk=RiskGuard(
            max_daily_budget=1000.00,
            max_cpa_bid=50.00,
            authorized_channels=["META", "GOOGLE", "LINKEDIN"]
        )
    )
