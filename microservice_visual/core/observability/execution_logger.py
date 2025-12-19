"""
Execution Logger - FASE 7 BLOQUE 7
Log estructurado de ejecución por bloque (stdout only, no persistence)
"""

from typing import Dict, Any, Optional
from datetime import datetime
import json


class ExecutionLogger:
    """
    Logger estructurado para ejecución de bloques.
    
    Responsabilidad:
    - Logs solo en memoria/stdout
    - NO side effects
    - NO persistencia real
    - Solo registro estructurado
    """
    
    def __init__(self):
        self.logs = []  # In-memory buffer for testing
    
    def log_start(
        self,
        stage: str,
        campaign_id: str,
        tenant_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Registra inicio de un stage de ejecución.
        
        Args:
            stage: Nombre del stage (e.g., "CONTENT_ASSEMBLY", "VISUAL_PIPELINE")
            campaign_id: ID de campaña
            tenant_id: ID de tenant
            metadata: Metadata adicional opcional
        """
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": "INFO",
            "event": "stage_start",
            "stage": stage,
            "campaign_id": campaign_id,
            "tenant_id": tenant_id,
            "metadata": metadata or {}
        }
        
        self._write_log(log_entry)
    
    def log_success(
        self,
        stage: str,
        campaign_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Registra éxito de un stage.
        
        Args:
            stage: Nombre del stage
            campaign_id: ID de campaña
            metadata: Metadata adicional (e.g., IDs generados, hashes)
        """
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": "INFO",
            "event": "stage_success",
            "stage": stage,
            "campaign_id": campaign_id,
            "metadata": metadata or {}
        }
        
        self._write_log(log_entry)
    
    def log_failure(
        self,
        stage: str,
        campaign_id: str,
        severity: str,
        reason_code: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Registra fallo de un stage.
        
        Args:
            stage: Nombre del stage
            campaign_id: ID de campaña
            severity: Severidad del fallo (CRITICAL, HIGH, MEDIUM, LOW)
            reason_code: Código de razón del fallo
            metadata: Evidencia del fallo
        """
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": "ERROR" if severity == "CRITICAL" else "WARN",
            "event": "stage_failure",
            "stage": stage,
            "campaign_id": campaign_id,
            "severity": severity,
            "reason_code": reason_code,
            "metadata": metadata or {}
        }
        
        self._write_log(log_entry)
    
    def _write_log(self, log_entry: Dict[str, Any]) -> None:
        """
        Escribe log a stdout y buffer interno.
        
        NO persistencia real - solo stdout.
        """
        # Stdout (formato JSON para parsing)
        print(json.dumps(log_entry))
        
        # In-memory buffer (para testing)
        self.logs.append(log_entry)
    
    def get_logs(self) -> list:
        """
        Obtiene logs del buffer interno (solo para testing).
        """
        return self.logs.copy()
    
    def clear_logs(self) -> None:
        """
        Limpia buffer interno (solo para testing).
        """
        self.logs.clear()
