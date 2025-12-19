"""
CopyPipeline: Orquestador del flujo de generación de copy.
Responsabilidad: Coordinar CopyEngine, validators y compliance.
"""
from typing import List, Union, Dict, Any
from contracts.payload import CampaignPayload
from contracts.artifacts import CopyVariant, ContentFailureReport, LayoutPlan
from contracts.enums import Severity

from microservice_copy.core.copy_engine import CopyEngine
from microservice_copy.core.copy_validators import CopyValidator
from microservice_copy.core.copy_compliance_bridge import CopyComplianceBridge


class CopyPipeline:
    """
    Orquestador principal del flujo de copy.
    Ejecuta el pipeline completo desde generación hasta validación.
    """
    
    def __init__(self):
        """
        Inyección de dependencias.
        """
        self.copy_engine = CopyEngine()
        self.validator = CopyValidator()
        self.compliance_bridge = CopyComplianceBridge()
    
    async def run_copy_flow(
        self,
        payload: CampaignPayload
    ) -> Union[List[CopyVariant], ContentFailureReport]:
        """
        Ejecuta el flujo completo de generación de copy:
        1. Validar inputs -> 2. Generar variantes -> 3. Validar copy -> 4. Compliance
        
        Args:
            payload: CampaignPayload con StrategyBrief, BrandGenome, LayoutPlan, etc.
            
        Returns:
            Union[List[CopyVariant], ContentFailureReport]:
                - Success: Lista de CopyVariant validadas
                - Failure: ContentFailureReport con reason_code + evidence
        """
        try:
            # ═══════════════════════════════════════════════════════════
            # PASO 1 — Validar inputs obligatorios
            # ═══════════════════════════════════════════════════════════
            try:
                # Validar strategy_brief
                if not hasattr(payload, 'strategy_brief') or not payload.strategy_brief:
                    return ContentFailureReport(
                        reason_code="MISSING_STRATEGY_BRIEF",
                        severity=Severity.CRITICAL,
                        evidence={"error": "payload.strategy_brief is required", "step": "input_validation"}
                    )
                
                # Validar brand_genome
                if not hasattr(payload, 'brand_genome') or not payload.brand_genome:
                    return ContentFailureReport(
                        reason_code="MISSING_BRAND_GENOME",
                        severity=Severity.CRITICAL,
                        evidence={"error": "payload.brand_genome is required", "step": "input_validation"}
                    )
                
                # Validar layout_plan (obligatorio)
                if not hasattr(payload, 'layout_plan') or not payload.layout_plan:
                    return ContentFailureReport(
                        reason_code="MISSING_LAYOUT_PLAN",
                        severity=Severity.CRITICAL,
                        evidence={"error": "payload.layout_plan is required", "step": "input_validation"}
                    )
                
                layout_plan = payload.layout_plan
                strategy_brief = payload.strategy_brief
                brand_genome = payload.brand_genome
                
                # Extraer visual_asset_id si existe
                visual_asset_id = None
                if hasattr(payload, 'visual_candidates') and payload.visual_candidates:
                    visual_asset_id = str(payload.visual_candidates[0].asset_id)
                
            except Exception as e:
                return ContentFailureReport(
                    reason_code="INPUT_VALIDATION_ERROR",
                    severity=Severity.HIGH,
                    evidence={"error": str(e), "step": "input_validation"}
                )
            
            # ═══════════════════════════════════════════════════════════
            # PASO 2 — Generar variantes de copy
            # ═══════════════════════════════════════════════════════════
            try:
                # Obtener seed del payload o usar default determinista
                seed = getattr(payload, "seed", 42)
                
                copy_variants = self.copy_engine.generate_variants(
                    strategy_brief=strategy_brief,
                    brand_genome=brand_genome,
                    layout_plan=layout_plan,
                    seed=seed,
                    visual_asset_id=visual_asset_id
                )
                
                if not copy_variants:
                    return ContentFailureReport(
                        reason_code="NO_VARIANTS_GENERATED",
                        severity=Severity.HIGH,
                        evidence={"error": "CopyEngine returned no variants", "step": "generation"}
                    )
                
            except Exception as e:
                return ContentFailureReport(
                    reason_code="GENERATION_ERROR",
                    severity=Severity.HIGH,
                    evidence={"error": str(e), "step": "generation"}
                )
            
            # ═══════════════════════════════════════════════════════════
            # PASO 3 — Validar copy (longitudes y campos requeridos)
            # ═══════════════════════════════════════════════════════════
            validated_variants = []
            
            # Obtener text_limits del platform_spec si existe
            text_limits = {"headline": 40, "body": 125, "cta": 18}  # Defaults
            if hasattr(payload, 'platform_spec') and payload.platform_spec:
                text_limits = payload.platform_spec.text_limits or text_limits
            
            for variant in copy_variants:
                try:
                    # Validar campos requeridos
                    required_validation = self.validator.validate_required_fields(variant)
                    if not required_validation.passed:
                        continue  # Skip variant inválida
                    
                    # Validar longitudes
                    length_validation = self.validator.validate_length(variant, text_limits)
                    if not length_validation.passed:
                        continue  # Skip variant que excede límites
                    
                    # Validar longitudes mínimas
                    min_validation = self.validator.validate_min_length(variant)
                    if not min_validation.passed:
                        continue  # Skip variant muy corta
                    
                    validated_variants.append(variant)
                    
                except Exception as e:
                    # Log error pero continuar con otras variantes
                    continue
            
            if not validated_variants:
                return ContentFailureReport(
                    reason_code="NO_VALID_VARIANTS",
                    severity=Severity.HIGH,
                    evidence={
                        "error": "All variants failed validation",
                        "step": "copy_validation",
                        "total_generated": len(copy_variants)
                    }
                )
            
            # ═══════════════════════════════════════════════════════════
            # PASO 4 — Compliance (validar contra BrandGenome)
            # ═══════════════════════════════════════════════════════════
            compliant_variants = []
            
            for variant in validated_variants:
                try:
                    compliance_result = self.compliance_bridge.validate(
                        copy_variant=variant,
                        brand_genome=brand_genome
                    )
                    
                    if compliance_result.passed:
                        compliant_variants.append(variant)
                    
                except Exception as e:
                    # Log error pero continuar
                    continue
            
            if not compliant_variants:
                return ContentFailureReport(
                    reason_code="NO_COMPLIANT_VARIANTS",
                    severity=Severity.HIGH,
                    evidence={
                        "error": "All variants failed compliance",
                        "step": "compliance",
                        "validated_count": len(validated_variants)
                    }
                )
            
            # ═══════════════════════════════════════════════════════════
            # PASO 5 — Respuesta (retornar variantes aprobadas)
            # ═══════════════════════════════════════════════════════════
            return compliant_variants
            
        except Exception as e:
            # Catch-all para errores inesperados
            return ContentFailureReport(
                evidence={"error": str(e), "step": "unknown"}
        )


