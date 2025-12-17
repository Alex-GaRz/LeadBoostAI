"""
Audit Context - Data Transfer Object for governance evaluation.

The AuditContext bundles all information needed by governance rules
to make decisions. This includes the campaign payload, brand genome,
and any assets generated.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# Import from shared_lib contracts
from contracts import CampaignPayload

# Import from local governance
from ..genome.models import BrandGenome


class AuditContext(BaseModel):
    """
    Context object passed to all governance rules.
    
    Contains all data necessary for making governance decisions:
    - The campaign being audited
    - The brand genome (rules)
    - Generated assets
    - Any additional metadata
    """
    
    payload: CampaignPayload = Field(
        ...,
        description="The campaign payload being audited"
    )
    
    genome: BrandGenome = Field(
        ...,
        description="The brand genome containing governance rules"
    )
    
    assets: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Visual or content assets generated for the campaign"
    )
    
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional context information"
    )
    
    class Config:
        # Allow arbitrary types (like CampaignPayload)
        arbitrary_types_allowed = True
        
        json_schema_extra = {
            "example": {
                "payload": {
                    "campaign_id": "550e8400-e29b-41d4-a716-446655440000",
                    "tenant_id": "660e8400-e29b-41d4-a716-446655440000",
                    "current_state": "QUALITY_AUDIT"
                },
                "genome": {
                    "tenant_id": "660e8400-e29b-41d4-a716-446655440000",
                    "brand_name": "TestBrand"
                },
                "assets": [
                    {
                        "asset_id": "asset_001",
                        "type": "image",
                        "url": "https://cdn.example.com/image.jpg"
                    }
                ],
                "metadata": {
                    "audit_timestamp": "2025-12-17T10:00:00Z",
                    "auditor_version": "1.0"
                }
            }
        }
    
    def get_total_budget(self) -> float:
        """
        Helper: Get total budget from strategy.
        
        Returns:
            Total budget across all channels, or 0.0 if not available
        """
        if not self.payload.strategy or not self.payload.strategy.budget_allocation:
            return 0.0
        
        return sum(self.payload.strategy.budget_allocation.values())
    
    def get_core_message(self) -> str:
        """
        Helper: Get the core message from strategy.
        
        Returns:
            Core message string, or empty string if not available
        """
        if not self.payload.strategy:
            return ""
        
        return self.payload.strategy.core_message or ""
    
    def get_channels(self) -> List[str]:
        """
        Helper: Get list of channels from strategy.
        
        Returns:
            List of channel names, or empty list if not available
        """
        if not self.payload.strategy:
            return []
        
        return self.payload.strategy.channels or []
    
    def has_strategy(self) -> bool:
        """
        Check if the payload has a strategy defined.
        
        Returns:
            True if strategy exists, False otherwise
        """
        return self.payload.strategy is not None
    
    def has_assets(self) -> bool:
        """
        Check if any assets have been generated.
        
        Returns:
            True if assets exist, False otherwise
        """
        return len(self.assets) > 0
