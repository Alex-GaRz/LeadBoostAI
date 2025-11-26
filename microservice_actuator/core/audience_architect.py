import logging
from typing import Dict, List
from microservice_actuator.models.extended_schemas import AudienceSegment

logger = logging.getLogger("AudienceArchitect")

class AudienceArchitect:
    """
    Traduce 'Pain Points' y 'Reasoning' en configuraciones de targeting
    específicas para cada plataforma publicitaria.
    """

    def construct_audience(self, reasoning: str, target_persona: str) -> AudienceSegment:
        logger.info(f"📐 Diseñando arquitectura de audiencia para: {target_persona}")
        
        segment = AudienceSegment(rationale=f"Derivado de: {reasoning[:50]}...")
        reasoning_lower = reasoning.lower()

        # --- Lógica de Inferencia (Heurística Avanzada para MVP) ---
        
        # 1. Detección de Sensibilidad al Precio
        if any(x in reasoning_lower for x in ["precio", "caro", "ahorro", "presupuesto"]):
            segment.interests.extend(["Discounts and allowances", "Sales promotion"])
            segment.positive_keywords.extend(["cheap", "affordable", "price comparison", "low cost"])
            segment.negative_keywords.extend(["luxury", "premium", "expensive"])
            segment.behaviors.append("Value Shoppers")

        # 2. Detección de Calidad/Premium
        elif any(x in reasoning_lower for x in ["calidad", "premium", "lujo", "exclusivo"]):
            segment.interests.extend(["Luxury goods", "First class travel"])
            segment.positive_keywords.extend(["best", "top rated", "premium services", "luxury"])
            segment.negative_keywords.extend(["cheap", "free", "diy"])
            segment.job_titles.extend(["CEO", "Director", "Vice President"])

        # 3. Detección de Urgencia/Emergencia
        if "urgente" in reasoning_lower or "inmediato" in reasoning_lower:
            segment.positive_keywords.extend(["emergency service", "24/7", "now"])
            segment.behaviors.append("Engaged Shoppers")

        # --- Mapeo B2B (LinkedIn Specifics) ---
        if "b2b" in target_persona.lower() or "empresarial" in reasoning_lower:
            segment.industries.extend(["Information Technology", "Financial Services", "Software Development"])
            segment.job_titles.extend(["Decision Maker", "Founder", "Purchasing Manager"])

        # --- CORRECCIÓN: Fallback de seguridad ---
        if not segment.interests and not segment.positive_keywords:
            logger.warning("⚠️ Reasoning abstracto detectado. Aplicando segmentación por defecto.")
            segment.interests.extend(["Technology", "Innovation", "Digital Services"])
            segment.behaviors.append("Early Adopters")
        # -----------------------------------------

        logger.info(f"✅ Audiencia construida: {len(segment.interests)} intereses, {len(segment.positive_keywords)} keywords.")
        return segment
