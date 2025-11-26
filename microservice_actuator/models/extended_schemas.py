from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class PlatformName(str, Enum):
    META = "meta"
    GOOGLE = "google"
    LINKEDIN = "linkedin"

class CreativeAsset(BaseModel):
    headline: str
    body_text: str
    image_url: Optional[str] = None
    call_to_action: str

class AudienceSegment(BaseModel):
    # Meta
    interests: List[str] = []
    behaviors: List[str] = []
    # Google
    positive_keywords: List[str] = []
    negative_keywords: List[str] = []
    # LinkedIn
    job_titles: List[str] = []
    industries: List[str] = []
    
    rationale: str  # Por qué se eligió esta segmentación

class CampaignPayload(BaseModel):
    """Payload final listo para enviar al Mock ERP / API Real"""
    platform: PlatformName
    objective: str
    targeting: Dict[str, Any]
    creative: Dict[str, Any]
    budget_settings: Dict[str, Any]
