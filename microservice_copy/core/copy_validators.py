"""
Copy Validators: Validaciones técnicas de texto (NO políticas de marca).
Responsabilidad: Validar longitudes, campos requeridos y estructura de CopyVariant.
"""
from dataclasses import dataclass
from typing import Optional, Dict, Any
from contracts.artifacts import CopyVariant


@dataclass
class ValidationResult:
    """
    Resultado de validación con evidencia.
    """
    passed: bool
    reason_code: Optional[str] = None
    evidence: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.evidence is None:
            self.evidence = {}


class CopyValidator:
    """
    Validador de calidad técnica de copy.
    No tiene conocimiento de políticas de marca.
    """
    
    def validate_length(
        self,
        copy_variant: CopyVariant,
        text_limits: Dict[str, int]
    ) -> ValidationResult:
        """
        Valida que el copy respete los límites de longitud de la plataforma.
        
        Args:
            copy_variant: CopyVariant a validar
            text_limits: Límites por campo {"headline": 40, "body": 125, "cta": 18}
            
        Returns:
            ValidationResult con resultado de la validación
        """
        evidence = {
            "headline_length": len(copy_variant.headline),
            "body_length": len(copy_variant.body),
            "cta_length": len(copy_variant.cta),
            "limits": text_limits
        }
        
        # Validar headline
        if "headline" in text_limits:
            if len(copy_variant.headline) > text_limits["headline"]:
                return ValidationResult(
                    passed=False,
                    reason_code="HEADLINE_TOO_LONG",
                    evidence={
                        **evidence,
                        "failed_field": "headline",
                        "actual": len(copy_variant.headline),
                        "limit": text_limits["headline"]
                    }
                )
        
        # Validar body
        if "body" in text_limits:
            if len(copy_variant.body) > text_limits["body"]:
                return ValidationResult(
                    passed=False,
                    reason_code="BODY_TOO_LONG",
                    evidence={
                        **evidence,
                        "failed_field": "body",
                        "actual": len(copy_variant.body),
                        "limit": text_limits["body"]
                    }
                )
        
        # Validar CTA
        if "cta" in text_limits:
            if len(copy_variant.cta) > text_limits["cta"]:
                return ValidationResult(
                    passed=False,
                    reason_code="CTA_TOO_LONG",
                    evidence={
                        **evidence,
                        "failed_field": "cta",
                        "actual": len(copy_variant.cta),
                        "limit": text_limits["cta"]
                    }
                )
        
        return ValidationResult(
            passed=True,
            evidence=evidence
        )
    
    def validate_required_fields(self, copy_variant: CopyVariant) -> ValidationResult:
        """
        Valida que todos los campos requeridos estén presentes y no vacíos.
        
        Args:
            copy_variant: CopyVariant a validar
            
        Returns:
            ValidationResult con resultado de la validación
        """
        missing_fields = []
        
        if not copy_variant.headline or not copy_variant.headline.strip():
            missing_fields.append("headline")
        
        if not copy_variant.body or not copy_variant.body.strip():
            missing_fields.append("body")
        
        if not copy_variant.cta or not copy_variant.cta.strip():
            missing_fields.append("cta")
        
        if missing_fields:
            return ValidationResult(
                passed=False,
                reason_code="MISSING_REQUIRED_FIELDS",
                evidence={
                    "missing_fields": missing_fields,
                    "check": "required_fields"
                }
            )
        
        return ValidationResult(
            passed=True,
            evidence={
                "check": "required_fields",
                "all_present": True
            }
        )
    
    def validate_min_length(
        self,
        copy_variant: CopyVariant,
        min_lengths: Dict[str, int] = None
    ) -> ValidationResult:
        """
        Valida longitudes mínimas razonables.
        
        Args:
            copy_variant: CopyVariant a validar
            min_lengths: Longitudes mínimas {"headline": 5, "body": 20, "cta": 3}
            
        Returns:
            ValidationResult con resultado de la validación
        """
        if min_lengths is None:
            min_lengths = {"headline": 5, "body": 20, "cta": 3}
        
        evidence = {
            "headline_length": len(copy_variant.headline),
            "body_length": len(copy_variant.body),
            "cta_length": len(copy_variant.cta),
            "min_lengths": min_lengths
        }
        
        # Validar headline
        if len(copy_variant.headline) < min_lengths.get("headline", 5):
            return ValidationResult(
                passed=False,
                reason_code="HEADLINE_TOO_SHORT",
                evidence={
                    **evidence,
                    "failed_field": "headline",
                    "actual": len(copy_variant.headline),
                    "minimum": min_lengths.get("headline", 5)
                }
            )
        
        # Validar body
        if len(copy_variant.body) < min_lengths.get("body", 20):
            return ValidationResult(
                passed=False,
                reason_code="BODY_TOO_SHORT",
                evidence={
                    **evidence,
                    "failed_field": "body",
                    "actual": len(copy_variant.body),
                    "minimum": min_lengths.get("body", 20)
                }
            )
        
        # Validar CTA
        if len(copy_variant.cta) < min_lengths.get("cta", 3):
            return ValidationResult(
                passed=False,
                reason_code="CTA_TOO_SHORT",
                evidence={
                    **evidence,
                    "failed_field": "cta",
                    "actual": len(copy_variant.cta),
                    "minimum": min_lengths.get("cta", 3)
                }
            )
        
        return ValidationResult(
            passed=True,
            evidence=evidence
        )
