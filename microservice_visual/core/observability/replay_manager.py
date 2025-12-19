"""
Replay Manager - FASE 7 BLOQUE 7
Preparación de información para replay futuro (no ejecución)
"""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from .trace_collector import ExecutionTrace


@dataclass
class ReplayRequest:
    """
    Request para replay de ejecución.
    
    Describe cómo reejecutar una campaña de forma determinista,
    pero NO ejecuta el replay.
    """
    campaign_id: str
    tenant_id: str
    execution_id: str
    required_inputs: Dict[str, Any] = field(default_factory=dict)
    deterministic_params: Dict[str, Any] = field(default_factory=dict)
    stages_to_replay: List[str] = field(default_factory=list)
    notes: str = ""


class ReplayManager:
    """
    Manager para preparación de replay.
    
    Responsabilidad:
    - Preparar información necesaria para replay
    - Describir cómo se reejecutaría
    - NO ejecutar replay
    - NO modificar estado
    """
    
    def prepare_replay(self, trace: ExecutionTrace) -> ReplayRequest:
        """
        Prepara información para replay de una ejecución.
        
        Args:
            trace: ExecutionTrace con información de ejecución original
        
        Returns:
            ReplayRequest con instrucciones de replay
        """
        replay = ReplayRequest(
            campaign_id=trace.campaign_id,
            tenant_id=trace.tenant_id,
            execution_id=trace.execution_id
        )
        
        # Identificar inputs requeridos
        replay.required_inputs = self._identify_required_inputs(trace)
        
        # Extraer parámetros deterministas
        replay.deterministic_params = self._extract_deterministic_params(trace)
        
        # Identificar stages a reejecutar
        replay.stages_to_replay = trace.stages_executed.copy()
        
        # Generar notas de replay
        replay.notes = self._generate_replay_notes(trace)
        
        return replay
    
    def _identify_required_inputs(self, trace: ExecutionTrace) -> Dict[str, Any]:
        """
        Identifica inputs necesarios para replay.
        """
        required = {
            "campaign_id": trace.campaign_id,
            "tenant_id": trace.tenant_id,
            "execution_id": trace.execution_id
        }
        
        # Agregar IDs de assets si existen
        if trace.asset_ids:
            required["asset_ids"] = trace.asset_ids
        
        return required
    
    def _extract_deterministic_params(self, trace: ExecutionTrace) -> Dict[str, Any]:
        """
        Extrae parámetros deterministas para reproducibilidad.
        """
        params = {}
        
        # Seeds conocidos
        if trace.seeds:
            params["seeds"] = trace.seeds
        
        # Hashes conocidos (para validación)
        if trace.hashes:
            params["expected_hashes"] = trace.hashes
        
        # Retry count (para replicar intentos)
        if "retry_count" in trace.metadata:
            params["retry_count"] = trace.metadata["retry_count"]
        
        return params
    
    def _generate_replay_notes(self, trace: ExecutionTrace) -> str:
        """
        Genera notas descriptivas para el replay.
        """
        notes_parts = []
        
        # Información general
        notes_parts.append(
            f"Replay of execution {trace.execution_id} "
            f"for campaign {trace.campaign_id}"
        )
        
        # Stages ejecutados
        if trace.stages_executed:
            stages_str = ", ".join(trace.stages_executed)
            notes_parts.append(f"Stages executed: {stages_str}")
        
        # Seeds disponibles
        if trace.seeds:
            seeds_count = len(trace.seeds)
            notes_parts.append(f"Seeds available: {seeds_count}")
        
        # Hashes disponibles
        if trace.hashes:
            hashes_count = len(trace.hashes)
            notes_parts.append(f"Hashes for validation: {hashes_count}")
        
        # Intentos de retry
        if "retry_count" in trace.metadata:
            retry_count = trace.metadata["retry_count"]
            notes_parts.append(f"Retry count: {retry_count}")
        
        return " | ".join(notes_parts)
    
    def validate_replay_feasibility(self, trace: ExecutionTrace) -> Dict[str, Any]:
        """
        Valida si el replay es factible con la información disponible.
        
        Returns:
            Dict con resultado de validación:
            - feasible: bool
            - missing_params: List[str]
            - warnings: List[str]
        """
        result = {
            "feasible": True,
            "missing_params": [],
            "warnings": []
        }
        
        # Validar seeds
        if not trace.seeds or len(trace.seeds) == 0:
            result["warnings"].append("No seeds available - replay may not be deterministic")
        
        # Validar hashes
        if not trace.hashes or len(trace.hashes) == 0:
            result["warnings"].append("No hashes available - output validation not possible")
        
        # Validar stages
        if not trace.stages_executed or len(trace.stages_executed) == 0:
            result["feasible"] = False
            result["missing_params"].append("stages_executed")
        
        # Validar IDs básicos
        if not trace.campaign_id:
            result["feasible"] = False
            result["missing_params"].append("campaign_id")
        
        return result
