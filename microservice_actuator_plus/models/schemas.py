from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from enum import Enum
from datetime import datetime
import uuid

class MetricSource(str, Enum):
    META_ADS = "META_ADS"
    GOOGLE_ADS = "GOOGLE_ADS"
    LOGISTICS_ERP = "LOGISTICS_ERP"
    MOCK_GENERATOR = "MOCK_GENERATOR"

class WebhookPayload(BaseModel):
    """Payload crudo recibido desde el exterior"""
    source: MetricSource
    execution_id: str = Field(..., description="ID de ejecución generado por el Bloque 7")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    data: Dict[str, Any] = Field(..., description="Datos crudos específicos de la plataforma")

class StandardPerformanceMetric(BaseModel):
    """
    Métrica normalizada universal que el Bloque 10 puede entender.
    Convierte peras y manzanas en 'Performance Units'.
    """
    metric_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    execution_id: str
    timestamp: datetime
    source: MetricSource
    
    # Métrica unificada (0.0 a 1.0 o valor absoluto normalizado como ROI)
    # Esto permite al sistema comparar el éxito independientemente del canal.
    performance_score: float 
    
    # Metadatos clave extraídos para contexto humano
    key_metrics: Dict[str, float] = Field(..., description="Ej: {'roi': 2.5, 'ctr': 0.05}")
    
    raw_data_snapshot: Dict[str, Any] # Guardamos el original para auditoría