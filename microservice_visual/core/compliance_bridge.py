"""
ComplianceBridge: Ejecuta reglas del BrandGenome (stub determinista).
Responsabilidad: Validar que los assets cumplan políticas de marca.
"""
from typing import Dict, Any, Optional
from contracts.artifacts import LayoutPlan
from .engines.validators import ValidationResult


class ComplianceBridge:
    """
    Bridge para ejecutar validaciones de BrandGenome.
    Versión stub determinista sin lógica compleja.
    """
    
    def validate(
        self,
        layout_plan: LayoutPlan,
        brand_genome: Dict[str, Any]
    ) -> ValidationResult:
        """
        Ejecuta validaciones de políticas de marca.
        
        Args:
            layout_plan: LayoutPlan usado en el asset
            text_layer: TextLayer con tipografía (puede ser None)
            brand_genome: Diccionario con reglas de marca
            
        Returns:
            ValidationResult con resultado de compliance
            
        Validaciones stub:
            - allowed_fonts: si existe y hay text_layer, validar font_family_used
            - allowed_palette: verificar presencia (sin cálculo real)
            - safe_zone_violations: ya validado en layout, solo check
        """
        evidence = {
            "layout_violations": layout_plan.safe_zone_violations,
            "checks_performed": []
        }
        
        # Check 1: Safe zones
        if layout_plan.safe_zone_violations > 0:
            return ValidationResult(
                passed=False,
                reason_code="SAFE_ZONE_VIOLATION",
                evidence={
                    **evidence,
                    "violations": layout_plan.safe_zone_violations,
                    "check": "safe_zones"
                }
            )
        evidence["checks_performed"].append("safe_zones")
        
        # Check 2: Skip font validation (no text_layer available)
        evidence["checks_performed"].append("font_family_skipped")
        
        # Check 3: Allowed palette (stub - solo verificar presencia)
        if brand_genome.get("allowed_palette"):
            # TODO: Implementar validación real de colores
            # Por ahora solo registramos que la regla existe
            evidence["checks_performed"].append("palette_presence_check")
        
        # Todas las validaciones pasaron
        return ValidationResult(
            passed=True,
            evidence=evidence
        )
    
    def validate_safe_zones(
        self,
        layout_plan: LayoutPlan,
        brand_genome: Dict[str, Any]
    ) -> ValidationResult:
        """
        Validación específica de safe zones.
        
        Args:
            layout_plan: LayoutPlan a validar
            brand_genome: Reglas de marca
            
        Returns:
            ValidationResult
        """
        if layout_plan.safe_zone_violations > 0:
            return ValidationResult(
                passed=False,
                reason_code="SAFE_ZONE_VIOLATION",
                evidence={
                    "violations": layout_plan.safe_zone_violations,
                    "check": "safe_zones"
                }
            )
        
        return ValidationResult(
            passed=True,
            evidence={"violations": 0}
        )
