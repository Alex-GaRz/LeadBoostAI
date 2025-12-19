"""
Production States - FASE 7 BLOQUE 6
Estados canónicos de producción para handoff a core_orchestrator
"""

from enum import Enum
from contracts import Severity


class ProductionState(str, Enum):
    """
    Estados finales de la ejecución de contenido.
    
    Mapeo desde ContentFailureReport.severity:
    - Success (ContentPackage) → READY_FOR_PUBLISH
    - Severity.CRITICAL → FAILED
    - Severity.HIGH/MEDIUM/LOW → RETRYABLE
    """
    READY_FOR_PUBLISH = "READY_FOR_PUBLISH"
    FAILED = "FAILED"
    RETRYABLE = "RETRYABLE"


def map_severity_to_state(severity: Severity) -> ProductionState:
    """
    Mapea Severity de failure report a ProductionState.
    
    Args:
        severity: Severity del ContentFailureReport
    
    Returns:
        ProductionState correspondiente
    """
    if severity == Severity.CRITICAL:
        return ProductionState.FAILED
    else:
        # HIGH, MEDIUM, LOW son retryables
        return ProductionState.RETRYABLE
