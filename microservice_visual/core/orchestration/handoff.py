"""
Content Handoff Builder - FASE 7 BLOQUE 6
Construcción de payloads finales para core_orchestrator
"""

from typing import Dict, Any
from contracts import ContentPackage, ContentFailureReport
from .states import ProductionState, map_severity_to_state


class ContentHandoffBuilder:
    """
    Constructor de payloads para handoff a core_orchestrator.
    
    Responsabilidad:
    - Envolver ContentPackage o ContentFailureReport en estructura de producción
    - NO transforma contenido
    - NO ejecuta lógica de negocio
    """
    
    def build_success(
        self,
        package: ContentPackage,
        campaign_id: str,
        tenant_id: str
    ) -> Dict[str, Any]:
        """
        Construye payload de éxito para orquestador.
        
        Args:
            package: ContentPackage ensamblado
            campaign_id: ID de campaña
            tenant_id: ID de tenant
        
        Returns:
            Dict con estructura canónica para core_orchestrator
        """
        # Extraer IDs y hashes de metadata si existen
        visual_asset_id = package.assembly_metadata.get("visual_asset_id")
        copy_variant_id = package.assembly_metadata.get("copy_variant_id")
        
        # Construir trace mínima
        trace = {
            "package_id": str(package.package_id),
            "visual_asset_id": visual_asset_id,
            "copy_variant_id": copy_variant_id
        }
        
        # Agregar hashes si existen en technical_metadata
        if package.visual_asset.technical_metadata:
            visual_hash = package.visual_asset.technical_metadata.get("hash")
            if visual_hash:
                trace["visual_hash"] = visual_hash
        
        return {
            "campaign_id": campaign_id,
            "tenant_id": tenant_id,
            "production_state": ProductionState.READY_FOR_PUBLISH.value,
            "content_package": {
                "package_id": str(package.package_id),
                "visual_asset": {
                    "asset_id": str(package.visual_asset.asset_id),
                    "url": package.visual_asset.url,
                    "quality_score": package.visual_asset.quality_score
                },
                "copy_variant": {
                    "variant_id": str(package.copy_variant.variant_id),
                    "type": package.copy_variant.type,
                    "text_content": package.copy_variant.text_content,
                    "tone_score": package.copy_variant.tone_score
                }
            },
            "trace": trace,
            "failure_report": None
        }
    
    def build_failure(
        self,
        report: ContentFailureReport,
        campaign_id: str,
        tenant_id: str
    ) -> Dict[str, Any]:
        """
        Construye payload de fallo para orquestador.
        
        Args:
            report: ContentFailureReport con detalles del fallo
            campaign_id: ID de campaña
            tenant_id: ID de tenant
        
        Returns:
            Dict con estructura canónica para core_orchestrator
        """
        # Mapear severity a production state
        production_state = map_severity_to_state(report.severity)
        
        # Construir trace mínima desde evidence
        trace = {
            "reason_code": report.reason_code,
            "severity": report.severity.value,
            "failed_checks": report.failed_checks
        }
        
        # Agregar IDs desde evidence si existen
        if report.evidence:
            if "visual_asset_id" in report.evidence:
                trace["visual_asset_id"] = report.evidence["visual_asset_id"]
            if "copy_variant_id" in report.evidence:
                trace["copy_variant_id"] = report.evidence["copy_variant_id"]
            if "unmatched_visual_ids" in report.evidence:
                trace["unmatched_visual_ids"] = report.evidence["unmatched_visual_ids"]
        
        return {
            "campaign_id": campaign_id,
            "tenant_id": tenant_id,
            "production_state": production_state.value,
            "content_package": None,
            "failure_report": {
                "reason_code": report.reason_code,
                "severity": report.severity.value,
                "evidence": report.evidence,
                "failed_checks": report.failed_checks
            },
            "trace": trace
        }
