from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, Index
from sqlalchemy.sql import func
from database import Base
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
import uuid
import json
import hashlib

def generate_uuid():
    return str(uuid.uuid4())

# --- MODELOS SQL (LEGACY/TRACEABILITY) ---
class DecisionTrace(Base):
    __tablename__ = "decision_traces"

    id = Column(Integer, primary_key=True, index=True)
    trace_id = Column(String, unique=True, index=True, default=generate_uuid)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    action_type = Column(String, index=True)
    status = Column(String, default="COMPLETED")
    
    context_snapshot = Column(JSON) 
    strategy_snapshot = Column(JSON)
    governance_result = Column(JSON)
    execution_id = Column(String, index=True, nullable=True)
    execution_details = Column(JSON, nullable=True)
    outcome_metric = Column(Float, nullable=True, index=True) 
    outcome_raw = Column(JSON, nullable=True)

    __table_args__ = (
        Index('idx_performance', 'action_type', 'outcome_metric'),
    )

# --- MODELOS VECTORIALES (EVOLUTIONARY MEMORY) ---

class VectorMemoryItem(BaseModel):
    """
    Representación de una memoria estratégica para inserción vectorial.
    """
    memory_id: str = Field(default_factory=generate_uuid)
    text_content: str = Field(..., description="Descripción narrativa de la estrategia y contexto")
    
    # Metadatos para filtrado y re-ranking
    metadata: Dict[str, Any] = Field(..., description="Debe incluir: roi, sector, season, timestamp")
    
    # Factor de confianza evolutivo (0.0 a 2.0, default 1.0)
    trust_score: float = Field(default=1.0) 
    
    # Vector de 1536 dimensiones (OpenAI text-embedding-3-small)
    embedding: Optional[List[float]] = None

    def get_canonical_hash(self) -> str:
        """Genera un hash único basado en el contenido para evitar duplicados semánticos."""
        content_str = f"{self.text_content}_{json.dumps(self.metadata, sort_keys=True)}"
        return hashlib.sha256(content_str.encode()).hexdigest()

class FeedbackSignal(BaseModel):
    trace_id: str
    real_outcome: float
    expected_outcome: float