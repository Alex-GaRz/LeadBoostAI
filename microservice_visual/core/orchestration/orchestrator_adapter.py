"""
Orchestrator Adapter - FASE 7 BLOQUE 6
Punto único de integración con core_orchestrator
"""

from typing import Union
from contracts import (
    CampaignPayload,
    ContentPackage,
    ContentFailureReport,
    TraceEntry
)
from .handoff import ContentHandoffBuilder
from .states import ProductionState, map_severity_to_state


class OrchestratorAdapter:
    """
    Adaptador para comunicación con core_orchestrator.
    
    Responsabilidad:
    - Punto único de integración
    - Actualiza CampaignPayload con resultados de producción
    - NO realiza llamadas externas
    - NO emite eventos
    - NO tiene side effects
    """
    
    def __init__(self):
        self.handoff_builder = ContentHandoffBuilder()
    
    def prepare_payload(
        self,
        result: Union[ContentPackage, ContentFailureReport],
        payload: CampaignPayload
    ) -> CampaignPayload:
        """
        Actualiza CampaignPayload con resultados de producción.
        
        Args:
            result: ContentPackage (éxito) o ContentFailureReport (fallo)
            payload: CampaignPayload existente a actualizar
        
        Returns:
            CampaignPayload actualizado con production data
        """
        # Determinar si es éxito o fallo
        if isinstance(result, ContentPackage):
            return self._prepare_success_payload(result, payload)
        elif isinstance(result, ContentFailureReport):
            return self._prepare_failure_payload(result, payload)
        else:
            raise TypeError(
                f"Expected ContentPackage or ContentFailureReport, got {type(result)}"
            )
    
    def _prepare_success_payload(
        self,
        package: ContentPackage,
        payload: CampaignPayload
    ) -> CampaignPayload:
        """
        Actualiza payload con ContentPackage exitoso.
        """
        # Agregar visual asset a generated_assets
        if package.visual_asset not in payload.generated_assets:
            payload.generated_assets.append(package.visual_asset)
        
        # Agregar copy variant a copy_variants
        if package.copy_variant not in payload.copy_variants:
            payload.copy_variants.append(package.copy_variant)
        
        # Agregar trace entry
        trace_metadata = {
            "stage": "CONTENT_PROD",
            "production_state": ProductionState.READY_FOR_PUBLISH.value,
            "package_id": str(package.package_id),
            "visual_asset_id": str(package.visual_asset.asset_id),
            "copy_variant_id": str(package.copy_variant.variant_id)
        }
        
        payload.add_trace(
            actor_service="microservice_visual",
            action="content_assembly_success",
            metadata=trace_metadata
        )
        
        return payload
    
    def _prepare_failure_payload(
        self,
        report: ContentFailureReport,
        payload: CampaignPayload
    ) -> CampaignPayload:
        """
        Actualiza payload con ContentFailureReport.
        """
        # Mapear severity a production state
        production_state = map_severity_to_state(report.severity)
        
        # Construir trace metadata
        trace_metadata = {
            "stage": "CONTENT_PROD",
            "production_state": production_state.value,
            "reason_code": report.reason_code,
            "severity": report.severity.value,
            "failed_checks": report.failed_checks,
            "evidence": report.evidence
        }
        
        payload.add_trace(
            actor_service="microservice_visual",
            action="content_assembly_failure",
            metadata=trace_metadata
        )
        
        # Si es CRITICAL, podría setear terminal_reason
        # (pero esto debería ser responsabilidad del orchestrator)
        # Aquí solo registramos el fallo
        
        return payload

