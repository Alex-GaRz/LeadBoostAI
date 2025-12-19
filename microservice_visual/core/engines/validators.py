"""
Validators: Quality gates de imagen (NO compliance).
Responsabilidad: Validaciones técnicas de imagen sin conocimiento de marca.
"""
from dataclasses import dataclass
from typing import Optional, Dict, Any
from ...utils.image_ops import load_image, validate_image

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


class ImageValidator:
    """
    Validador de calidad técnica de imágenes.
    No tiene conocimiento de políticas de marca.
    """
    
    def validate_not_blank(self, image_bytes: bytes) -> ValidationResult:
        """
        Valida que la imagen no esté en blanco/negra.
        
        Args:
            image_bytes: Bytes de la imagen a validar
            
        Returns:
            ValidationResult con resultado de la validación
        """
        try:
            if not validate_image(image_bytes):
                return ValidationResult(
                    passed=False,
                    reason_code="INVALID_IMAGE",
                    evidence={"check": "basic_validation"}
                )
            
            img = load_image(image_bytes)
            
            # Obtener estadísticas básicas
            extrema = img.convert('L').getextrema()
            min_val, max_val = extrema
            
            # Si la imagen es completamente uniforme (blanco, negro, etc.)
            if min_val == max_val:
                return ValidationResult(
                    passed=False,
                    reason_code="BLANK_IMAGE",
                    evidence={
                        "check": "blank_detection",
                        "min_value": min_val,
                        "max_value": max_val
                    }
                )
            
            # Si tiene muy poco contraste
            if (max_val - min_val) < 10:
                return ValidationResult(
                    passed=False,
                    reason_code="LOW_CONTRAST_IMAGE",
                    evidence={
                        "check": "contrast_detection",
                        "contrast_range": max_val - min_val,
                        "threshold": 10
                    }
                )
            
            return ValidationResult(
                passed=True,
                evidence={
                    "check": "blank_detection",
                    "min_value": min_val,
                    "max_value": max_val,
                    "contrast_range": max_val - min_val
                }
            )
            
        except Exception as e:
            return ValidationResult(
                passed=False,
                reason_code="VALIDATION_ERROR",
                evidence={"error": str(e)}
            )
    
    def validate_min_resolution(
        self, 
        image_bytes: bytes, 
        min_w: int = 512, 
        min_h: int = 512
    ) -> ValidationResult:
        """
        Valida que la imagen cumpla con resolución mínima.
        
        Args:
            image_bytes: Bytes de la imagen
            min_w: Ancho mínimo requerido
            min_h: Alto mínimo requerido
            
        Returns:
            ValidationResult con resultado de la validación
        """
        try:
            if not validate_image(image_bytes):
                return ValidationResult(
                    passed=False,
                    reason_code="INVALID_IMAGE",
                    evidence={"check": "basic_validation"}
                )
            
            img = load_image(image_bytes)
            width, height = img.size
            
            if width < min_w or height < min_h:
                return ValidationResult(
                    passed=False,
                    reason_code="INSUFFICIENT_RESOLUTION",
                    evidence={
                        "check": "resolution",
                        "actual_width": width,
                        "actual_height": height,
                        "min_width": min_w,
                        "min_height": min_h
                    }
                )
            
            return ValidationResult(
                passed=True,
                evidence={
                    "check": "resolution",
                    "width": width,
                    "height": height
                }
            )
            
        except Exception as e:
            return ValidationResult(
                passed=False,
                reason_code="VALIDATION_ERROR",
                evidence={"error": str(e)}
            )
