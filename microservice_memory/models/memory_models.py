"""
Memory Data Models - FASE 6.1
Modelos canónicos para almacenamiento y recuperación de memoria corporativa.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Dict, List, Optional, Any
from datetime import datetime
from uuid import uuid4

# Intentar importar desde shared_lib (contractos compartidos)
try:
    from shared_lib.contracts.state_machine import CampaignState
    from shared_lib.contracts.quality import QualityVerdict
except ImportError:
    # Fallback: Definiciones locales si shared_lib no está disponible
    from enum import Enum
    
    class CampaignState(str, Enum):
        """Estados de campaña"""
        IDLE = "IDLE"
        STRATEGY_GEN = "STRATEGY_GEN"
        CREATIVE_GEN = "CREATIVE_GEN"
        AUDIT = "AUDIT"
        PUBLISH = "PUBLISH"
        LEARN = "LEARN"
        FAILED = "FAILED"
        DONE = "DONE"
    
    class QualityVerdict(str, Enum):
        """Veredictos de calidad"""
        PASS = "PASS"
        FAIL = "FAIL"
        REVIEW = "REVIEW"
        PENDING = "PENDING"


class MemoryMetrics(BaseModel):
    """
    Resultados duros de la ejecución de campaña.
    Estos son los KPIs finales que se almacenan para análisis futuro.
    """
    spend: float = Field(default=0.0, description="Gasto total en la campaña")
    impressions: int = Field(default=0, description="Total de impresiones")
    clicks: int = Field(default=0, description="Total de clicks")
    conversions: int = Field(default=0, description="Total de conversiones")
    ctr: float = Field(default=0.0, description="Click-Through Rate")
    roas: float = Field(default=0.0, description="Return on Ad Spend")
    quality_score: int = Field(default=0, ge=0, le=100, description="Score de auditoría (0-100)")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "spend": 1500.50,
                "impressions": 45000,
                "clicks": 890,
                "conversions": 23,
                "ctr": 1.98,
                "roas": 3.5,
                "quality_score": 87
            }
        }
    )


class ContextCard(BaseModel):
    """
    Representación CANÓNICA para vectorización.
    Este texto es lo que se convierte en embeddings para búsqueda semántica.
    """
    summary_text: str = Field(..., description="Texto narrativo denso para vectorización")
    tags: List[str] = Field(default_factory=list, description="Tags categóricos para filtrado")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "summary_text": "Campaña B2B para LinkedIn. Tenant: TechCorp. Objetivo: Generación de Leads. Audiencia: CTOs en Latam. Tono: Autoritario. Resultado: ROAS 3.5 (Alto). Calidad: PASS.",
                "tags": ["B2B", "LinkedIn", "High-Budget", "Tech-Industry"]
            }
        }
    )


class MemoryEntry(BaseModel):
    """
    La unidad atómica de memoria corporativa.
    Representa una ejecución completa de campaña con toda su metadata.
    """
    memory_id: str = Field(default_factory=lambda: str(uuid4()), description="UUID único de la memoria")
    tenant_id: str = Field(..., description="ID del tenant (CRÍTICO para aislamiento)")
    execution_id: str = Field(..., description="ID de la ejecución específica")
    campaign_id: str = Field(..., description="ID de la campaña")
    
    # Metadatos Estructurados (Filtros SQL-like)
    platform: str = Field(..., description="Plataforma publicitaria (LINKEDIN, FACEBOOK, etc)")
    objective: str = Field(..., description="Objetivo de campaña (LEADS, TRAFFIC, AWARENESS)")
    creation_date: datetime = Field(default_factory=datetime.utcnow, description="Timestamp de creación")
    final_state: CampaignState = Field(..., description="Estado final de la campaña")
    quality_verdict: QualityVerdict = Field(..., description="Veredicto de auditoría")
    
    # Data Rica (Payloads completos en formato resumido)
    strategy_summary: Dict[str, Any] = Field(default_factory=dict, description="Resumen del StrategyBrief")
    creative_summary: Dict[str, Any] = Field(default_factory=dict, description="Resumen de Visual/Copy")
    metrics: MemoryMetrics = Field(default_factory=MemoryMetrics, description="KPIs finales")
    
    # Vectorización
    context_card: ContextCard = Field(..., description="Card narrativa para búsqueda semántica")
    
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "memory_id": "550e8400-e29b-41d4-a716-446655440000",
                "tenant_id": "tenant-abc-123",
                "execution_id": "exec-xyz-789",
                "campaign_id": "camp-456",
                "platform": "LINKEDIN",
                "objective": "LEADS",
                "creation_date": "2024-11-15T10:30:00Z",
                "final_state": "LEARN",
                "quality_verdict": "PASS",
                "strategy_summary": {"audience": "CTOs", "tone": "authoritative"},
                "creative_summary": {"headline": "Transform Your Security", "format": "infographic"},
                "metrics": {
                    "spend": 1500.50,
                    "roas": 3.5,
                    "quality_score": 87
                },
                "context_card": {
                    "summary_text": "Campaña B2B exitosa...",
                    "tags": ["B2B", "Tech"]
                }
            }
        }
    )


class MemoryIngestRequest(BaseModel):
    """Request para endpoint /ingest"""
    payload: Dict[str, Any] = Field(..., description="CampaignPayload completo en estado terminal")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "payload": {
                    "tenant_id": "tenant-123",
                    "campaign_id": "camp-456",
                    "state": "LEARN",
                    "platform": "LINKEDIN"
                }
            }
        }
    )


class MemoryRetrieveRequest(BaseModel):
    """Request para endpoint /retrieve"""
    tenant_id: str = Field(..., description="ID del tenant solicitante")
    query_text: str = Field(..., description="Consulta en lenguaje natural")
    filters: Optional[Dict[str, Any]] = Field(default=None, description="Filtros adicionales (platform, min_quality, etc)")
    limit: int = Field(default=3, ge=1, le=10, description="Número máximo de resultados")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "tenant_id": "tenant-123",
                "query_text": "Campañas exitosas de LinkedIn para audiencias técnicas",
                "filters": {
                    "platform": "LINKEDIN",
                    "min_quality": "PASS"
                },
                "limit": 3
            }
        }
    )


class MemoryRetrieveResponse(BaseModel):
    """Response del endpoint /retrieve"""
    results: List[MemoryEntry] = Field(default_factory=list, description="Memorias recuperadas")
    count: int = Field(..., description="Número de resultados encontrados")
    query_embedding_dim: Optional[int] = Field(default=None, description="Dimensión del embedding usado (debug)")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "results": [],
                "count": 3,
                "query_embedding_dim": 1536
            }
        }
    )