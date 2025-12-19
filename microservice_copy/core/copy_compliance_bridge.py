"""
CopyComplianceBridge: Validaciones de políticas de marca para copy.
Responsabilidad: Ejecutar reglas del BrandGenome aplicables a texto.
"""
from typing import Dict, Any, List
from contracts.artifacts import CopyVariant
from microservice_copy.core.copy_validators import ValidationResult


class CopyComplianceBridge:
    """
    Bridge para ejecutar validaciones de BrandGenome en copy.
    Versión stub determinista sin lógica compleja.
    """
    
    def validate(
        self,
        copy_variant: CopyVariant,
        brand_genome: Dict[str, Any]
    ) -> ValidationResult:
        """
        Ejecuta validaciones de políticas de marca en copy.
        
        Args:
            copy_variant: CopyVariant a validar
            brand_genome: Diccionario con reglas de marca
            
        Returns:
            ValidationResult con resultado de compliance
            
        Validaciones stub:
            - tone permitido
            - palabras prohibidas (forbidden_words)
            - CTA permitido (allowed_ctas si existe)
        """
        evidence = {
            "checks_performed": []
        }
        
        # Check 1: Tone permitido
        allowed_tones = brand_genome.get("allowed_tones", [])
        if allowed_tones and copy_variant.tone not in allowed_tones:
            return ValidationResult(
                passed=False,
                reason_code="TONE_VIOLATION",
                evidence={
                    **evidence,
                    "check": "tone",
                    "used_tone": copy_variant.tone,
                    "allowed_tones": allowed_tones
                }
            )
        evidence["checks_performed"].append("tone")
        
        # Check 2: Palabras prohibidas
        forbidden_words = brand_genome.get("forbidden_words", [])
        if forbidden_words:
            found_forbidden = self._find_forbidden_words(
                copy_variant,
                forbidden_words
            )
            if found_forbidden:
                return ValidationResult(
                    passed=False,
                    reason_code="FORBIDDEN_TERMS",
                    evidence={
                        **evidence,
                        "check": "forbidden_words",
                        "found_terms": found_forbidden,
                        "locations": self._get_term_locations(copy_variant, found_forbidden)
                    }
                )
        evidence["checks_performed"].append("forbidden_words")
        
        # Check 3: CTA permitido (si existe lista)
        allowed_ctas = brand_genome.get("allowed_ctas", [])
        if allowed_ctas and copy_variant.cta not in allowed_ctas:
            return ValidationResult(
                passed=False,
                reason_code="CTA_NOT_ALLOWED",
                evidence={
                    **evidence,
                    "check": "cta",
                    "used_cta": copy_variant.cta,
                    "allowed_ctas": allowed_ctas
                }
            )
        evidence["checks_performed"].append("cta")
        
        # Todas las validaciones pasaron
        return ValidationResult(
            passed=True,
            evidence=evidence
        )
    
    def _find_forbidden_words(
        self,
        copy_variant: CopyVariant,
        forbidden_words: List[str]
    ) -> List[str]:
        """
        Busca palabras prohibidas en el copy.
        
        Args:
            copy_variant: CopyVariant a revisar
            forbidden_words: Lista de términos prohibidos
            
        Returns:
            Lista de términos encontrados
        """
        found = []
        all_text = f"{copy_variant.headline} {copy_variant.body} {copy_variant.cta}".lower()
        
        for word in forbidden_words:
            if word.lower() in all_text:
                found.append(word)
        
        return found
    
    def _get_term_locations(
        self,
        copy_variant: CopyVariant,
        terms: List[str]
    ) -> Dict[str, List[str]]:
        """
        Identifica en qué campos aparecen los términos.
        
        Args:
            copy_variant: CopyVariant a revisar
            terms: Términos a ubicar
            
        Returns:
            Dict con ubicaciones por término
        """
        locations = {}
        
        for term in terms:
            term_lower = term.lower()
            locs = []
            
            if term_lower in copy_variant.headline.lower():
                locs.append("headline")
            if term_lower in copy_variant.body.lower():
                locs.append("body")
            if term_lower in copy_variant.cta.lower():
                locs.append("cta")
            
            locations[term] = locs
        
        return locations
    
    def validate_tone_consistency(
        self,
        copy_variant: CopyVariant,
        expected_tone: str
    ) -> ValidationResult:
        """
        Valida que el tone del copy sea consistente con el esperado.
        
        Args:
            copy_variant: CopyVariant a validar
            expected_tone: Tone esperado del brand genome
            
        Returns:
            ValidationResult
        """
        if copy_variant.tone != expected_tone:
            return ValidationResult(
                passed=False,
                reason_code="TONE_MISMATCH",
                evidence={
                    "check": "tone_consistency",
                    "expected": expected_tone,
                    "actual": copy_variant.tone
                }
            )
        
        return ValidationResult(
            passed=True,
            evidence={
                "check": "tone_consistency",
                "tone": expected_tone
            }
        )
