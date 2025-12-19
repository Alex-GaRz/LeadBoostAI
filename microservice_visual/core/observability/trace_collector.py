"""
Trace Collector - FASE 7 BLOQUE 7
Recolección de trazas técnicas para auditoría (no interpretación)
"""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Union
from datetime import datetime
from contracts import CampaignPayload, ContentPackage


@dataclass
class ExecutionTrace:
    """
    Traza completa de ejecución para auditoría.
    
    Contiene solo información técnica recolectada,
    sin interpretación ni análisis.
    """
    campaign_id: str
    tenant_id: str
    execution_id: str
    stages_executed: List[str] = field(default_factory=list)
    hashes: Dict[str, str] = field(default_factory=dict)
    seeds: Dict[str, int] = field(default_factory=dict)
    timestamps: Dict[str, str] = field(default_factory=dict)
    asset_ids: Dict[str, str] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


class TraceCollector:
    """
    Recolector de trazas técnicas para auditoría.
    
    Responsabilidad:
    - Recolectar información técnica de payload y resultados
    - NO interpretar
    - NO analizar
    - Solo registrar hechos
    """
    
    def collect(
        self,
        payload: CampaignPayload,
        result: Optional[Union[ContentPackage, Any]] = None
    ) -> ExecutionTrace:
        """
        Recolecta traza técnica de una ejecución.
        
        Args:
            payload: CampaignPayload con contexto de campaña
            result: Resultado opcional (ContentPackage u otro artefacto)
        
        Returns:
            ExecutionTrace con información técnica recolectada
        """
        trace = ExecutionTrace(
            campaign_id=str(payload.campaign_id),
            tenant_id=str(payload.tenant_id),
            execution_id=str(payload.execution_id)
        )
        
        # Recolectar stages ejecutados desde execution_log
        trace.stages_executed = self._extract_stages(payload)
        
        # Recolectar timestamps desde execution_log
        trace.timestamps = self._extract_timestamps(payload)
        
        # Recolectar hashes conocidos
        trace.hashes = self._extract_hashes(payload, result)
        
        # Recolectar seeds conocidos
        trace.seeds = self._extract_seeds(payload, result)
        
        # Recolectar IDs de assets
        trace.asset_ids = self._extract_asset_ids(payload, result)
        
        # Metadata adicional
        trace.metadata = {
            "retry_count": payload.retry_count,
            "current_state": payload.current_state.value,
            "visual_attempts": payload.visual_attempts,
            "copy_attempts": payload.copy_attempts
        }
        
        return trace
    
    def _extract_stages(self, payload: CampaignPayload) -> List[str]:
        """
        Extrae stages ejecutados desde execution_log.
        """
        stages = []
        for entry in payload.execution_log:
            if hasattr(entry, 'metadata') and 'stage' in entry.metadata:
                stage = entry.metadata['stage']
                if stage not in stages:
                    stages.append(stage)
        return stages
    
    def _extract_timestamps(self, payload: CampaignPayload) -> Dict[str, str]:
        """
        Extrae timestamps de eventos clave.
        """
        timestamps = {}
        for entry in payload.execution_log:
            if hasattr(entry, 'timestamp') and hasattr(entry, 'action'):
                key = f"{entry.action}"
                timestamps[key] = entry.timestamp.isoformat() if hasattr(entry.timestamp, 'isoformat') else str(entry.timestamp)
        return timestamps
    
    def _extract_hashes(
        self,
        payload: CampaignPayload,
        result: Optional[Union[ContentPackage, Any]]
    ) -> Dict[str, str]:
        """
        Extrae hashes conocidos de assets.
        """
        hashes = {}
        
        # Hashes de generated_assets
        for idx, asset in enumerate(payload.generated_assets):
            if hasattr(asset, 'technical_metadata') and asset.technical_metadata:
                if 'hash' in asset.technical_metadata:
                    hashes[f"visual_asset_{idx}"] = asset.technical_metadata['hash']
        
        # Hash del result si es ContentPackage
        if result and isinstance(result, ContentPackage):
            if hasattr(result.visual_asset, 'technical_metadata'):
                if result.visual_asset.technical_metadata and 'hash' in result.visual_asset.technical_metadata:
                    hashes['final_visual'] = result.visual_asset.technical_metadata['hash']
        
        return hashes
    
    def _extract_seeds(
        self,
        payload: CampaignPayload,
        result: Optional[Union[ContentPackage, Any]]
    ) -> Dict[str, int]:
        """
        Extrae seeds conocidos para reproducibilidad.
        """
        seeds = {}
        
        # Seeds de generation_params en generated_assets
        for idx, asset in enumerate(payload.generated_assets):
            if hasattr(asset, 'generation_params') and asset.generation_params:
                if 'seed' in asset.generation_params:
                    seeds[f"visual_asset_{idx}"] = asset.generation_params['seed']
        
        return seeds
    
    def _extract_asset_ids(
        self,
        payload: CampaignPayload,
        result: Optional[Union[ContentPackage, Any]]
    ) -> Dict[str, str]:
        """
        Extrae IDs de assets generados.
        """
        asset_ids = {}
        
        # IDs de generated_assets
        for idx, asset in enumerate(payload.generated_assets):
            if hasattr(asset, 'asset_id'):
                asset_ids[f"visual_asset_{idx}"] = str(asset.asset_id)
        
        # IDs de copy_variants
        for idx, copy in enumerate(payload.copy_variants):
            if hasattr(copy, 'variant_id'):
                asset_ids[f"copy_variant_{idx}"] = str(copy.variant_id)
        
        # IDs del result si es ContentPackage
        if result and isinstance(result, ContentPackage):
            asset_ids['package_id'] = str(result.package_id)
        
        return asset_ids
