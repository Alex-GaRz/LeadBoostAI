from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, Index
from sqlalchemy.sql import func
from database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class DecisionTrace(Base):
    __tablename__ = "decision_traces"

    # Identificadores Principales
    id = Column(Integer, primary_key=True, index=True)
    trace_id = Column(String, unique=True, index=True, default=generate_uuid)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Metadatos de Alto Nivel
    action_type = Column(String, index=True) # Ej: "marketing_campaign", "stock_order"
    status = Column(String, default="COMPLETED") # COMPLETED, FAILED, BLOCKED_BY_GOVERNANCE
    
    # --- SNAPSHOTS DE LA CADENA DE VALOR ---
    
    # Bloque 4 (Analyst+): Qué disparó esto (La "Causa")
    # Contiene: anomaly_score, signal_content, metrics
    context_snapshot = Column(JSON) 
    
    # Bloque 5 (Advisor): Qué decidió la IA (El "Razonamiento")
    # Contiene: strategy_name, reasoning_text, proposed_actions
    strategy_snapshot = Column(JSON)
    
    # Bloque 6 (Governance): Quién lo aprobó/rechazó (El "Guardrail")
    # Contiene: approved (bool), policy_checks, blocking_rules
    governance_result = Column(JSON)
    
    # Bloque 7 (Actuator): Qué se ejecutó realmente (La "Acción")
    # Contiene: platform_response, execution_timestamp, external_ids
    execution_id = Column(String, index=True, nullable=True)
    execution_details = Column(JSON, nullable=True)
    
    # Bloque 8 (Feedback): Qué pasó después (El "Efecto")
    # Contiene: clicks, conversions, roi, actual_margin
    outcome_metric = Column(Float, nullable=True, index=True) # Normalizado 0.0 a 1.0
    outcome_raw = Column(JSON, nullable=True) # Datos crudos del feedback

    # Índices compuestos para analítica rápida
    __table_args__ = (
        Index('idx_performance', 'action_type', 'outcome_metric'),
    )