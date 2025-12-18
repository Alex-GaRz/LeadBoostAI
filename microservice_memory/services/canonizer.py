"""
Canonizer - FASE 6.1
Convierte payloads complejos en Context Cards narrativas densas para vectorización.
"""

from typing import Dict, Any, List
import logging
from datetime import datetime

from models.memory_models import ContextCard

logger = logging.getLogger(__name__)


class Canonizer:
    """
    Transforma payloads de campaña en narrativas densas y estructuradas.
    Estas narrativas son las que se vectorizan para búsqueda semántica.
    """
    
    @staticmethod
    def create_context_card(payload: Dict[str, Any]) -> ContextCard:
        """
        Convierte un CampaignPayload en una ContextCard.
        
        La Context Card es un texto narrativo denso que captura:
        - Tipo de campaña y objetivo
        - Audiencia y contexto
        - Estrategia aplicada
        - Resultados obtenidos
        - Calidad y aprendizajes
        
        Args:
            payload: CampaignPayload completo en estado terminal
            
        Returns:
            ContextCard con texto narrativo y tags
        """
        try:
            # Extraer campos clave del payload
            tenant_id = payload.get("tenant_id", "UNKNOWN")
            campaign_id = payload.get("campaign_id", "UNKNOWN")
            platform = payload.get("platform", "UNKNOWN").upper()
            objective = payload.get("objective", "UNKNOWN").upper()
            state = payload.get("state", "UNKNOWN")
            
            # Extraer strategy brief si existe
            strategy = payload.get("strategy_brief", {})
            audience_data = strategy.get("audience", {})
            tone = strategy.get("tone", "neutral")
            
            # Extraer creative data si existe
            creative = payload.get("creative_data", {})
            headline = creative.get("headline", "")
            description = creative.get("description", "")
            
            # Extraer métricas si existen
            metrics = payload.get("metrics", {})
            roas = metrics.get("roas", 0.0)
            quality_score = metrics.get("quality_score", 0)
            spend = metrics.get("spend", 0.0)
            conversions = metrics.get("conversions", 0)
            
            # Extraer calidad de auditoría
            audit = payload.get("audit", {})
            quality_verdict = audit.get("verdict", "UNKNOWN")
            
            # Construir descripción de audiencia
            audience_desc = Canonizer._build_audience_description(audience_data)
            
            # Construir descripción de resultado
            result_desc = Canonizer._build_result_description(
                roas, quality_score, conversions, quality_verdict
            )
            
            # Construir el texto narrativo denso
            summary_parts = [
                f"CAMPAÑA {Canonizer._categorize_campaign_type(objective, platform)}.",
                f"Tenant: {tenant_id}.",
                f"Plataforma: {platform}.",
                f"Objetivo: {objective}.",
            ]
            
            if audience_desc:
                summary_parts.append(f"Audiencia: {audience_desc}.")
            
            if tone:
                summary_parts.append(f"Tono: {tone.capitalize()}.")
            
            if headline:
                summary_parts.append(f"Headline: \"{headline[:100]}...\"." if len(headline) > 100 else f"Headline: \"{headline}\".")
            
            summary_parts.append(result_desc)
            
            if state == "FAILED":
                summary_parts.append("Estado: FALLÓ.")
            
            # Construir tags para filtrado rápido
            tags = Canonizer._generate_tags(payload, roas, quality_score)
            
            summary_text = " ".join(summary_parts)
            
            logger.debug(f"Context card created for {campaign_id}: {len(summary_text)} chars")
            
            return ContextCard(
                summary_text=summary_text,
                tags=tags
            )
            
        except Exception as e:
            logger.error(f"Failed to create context card: {e}")
            # Retornar una card mínima en caso de error
            return ContextCard(
                summary_text=f"Campaña {payload.get('campaign_id', 'UNKNOWN')} en {payload.get('platform', 'UNKNOWN')}",
                tags=["ERROR"]
            )
    
    @staticmethod
    def _build_audience_description(audience_data: Dict[str, Any]) -> str:
        """Construye descripción textual de la audiencia."""
        if not audience_data:
            return ""
        
        parts = []
        
        # Target roles
        if "target_roles" in audience_data:
            roles = audience_data["target_roles"]
            if isinstance(roles, list) and roles:
                parts.append(f"{', '.join(roles[:3])}")
        
        # Industrias
        if "industries" in audience_data:
            industries = audience_data["industries"]
            if isinstance(industries, list) and industries:
                parts.append(f"sector {', '.join(industries[:2])}")
        
        # Geografía
        if "geo" in audience_data or "locations" in audience_data:
            geo = audience_data.get("geo") or audience_data.get("locations")
            if isinstance(geo, list) and geo:
                parts.append(f"en {', '.join(geo[:2])}")
            elif isinstance(geo, str):
                parts.append(f"en {geo}")
        
        # Company size
        if "company_size" in audience_data:
            parts.append(f"empresas {audience_data['company_size']}")
        
        return " ".join(parts) if parts else "Audiencia general"
    
    @staticmethod
    def _build_result_description(
        roas: float, 
        quality_score: int, 
        conversions: int, 
        verdict: str
    ) -> str:
        """Construye descripción narrativa de los resultados."""
        parts = []
        
        # Evaluar ROAS
        if roas > 3.0:
            parts.append(f"ROAS {roas:.1f} (ALTO)")
        elif roas > 1.5:
            parts.append(f"ROAS {roas:.1f} (MEDIO)")
        elif roas > 0:
            parts.append(f"ROAS {roas:.1f} (BAJO)")
        else:
            parts.append("Sin datos de ROAS")
        
        # Conversiones
        if conversions > 0:
            parts.append(f"{conversions} conversiones")
        
        # Calidad
        if quality_score > 0:
            if quality_score >= 80:
                parts.append(f"Calidad: {quality_score}/100 (EXCELENTE)")
            elif quality_score >= 60:
                parts.append(f"Calidad: {quality_score}/100 (BUENA)")
            else:
                parts.append(f"Calidad: {quality_score}/100 (MEJORABLE)")
        
        # Veredicto
        parts.append(f"Veredicto: {verdict}")
        
        return "Resultado: " + ", ".join(parts) + "."
    
    @staticmethod
    def _categorize_campaign_type(objective: str, platform: str) -> str:
        """Categoriza el tipo de campaña para descripción."""
        objective = objective.upper()
        platform = platform.upper()
        
        if "B2B" in objective or "LEAD" in objective:
            return "B2B"
        elif "ECOM" in objective or "SALE" in objective:
            return "E-COMMERCE"
        elif "BRAND" in objective or "AWARE" in objective:
            return "BRANDING"
        else:
            return f"{platform} Marketing"
    
    @staticmethod
    def _generate_tags(payload: Dict[str, Any], roas: float, quality_score: int) -> List[str]:
        """Genera tags categóricos para filtrado."""
        tags = []
        
        # Platform
        platform = payload.get("platform", "").upper()
        if platform:
            tags.append(platform)
        
        # Objetivo
        objective = payload.get("objective", "").upper()
        if "LEAD" in objective:
            tags.append("LEADS")
        if "TRAFFIC" in objective:
            tags.append("TRAFFIC")
        if "AWARE" in objective:
            tags.append("AWARENESS")
        
        # Budget level (basado en spend)
        spend = payload.get("metrics", {}).get("spend", 0.0)
        if spend > 5000:
            tags.append("High-Budget")
        elif spend > 1000:
            tags.append("Medium-Budget")
        else:
            tags.append("Low-Budget")
        
        # Performance level
        if roas > 3.0:
            tags.append("High-Performance")
        elif roas > 1.5:
            tags.append("Medium-Performance")
        elif roas > 0:
            tags.append("Low-Performance")
        
        # Quality level
        if quality_score >= 80:
            tags.append("High-Quality")
        elif quality_score >= 60:
            tags.append("Medium-Quality")
        
        # Estado
        state = payload.get("state", "")
        if state == "FAILED":
            tags.append("FAILED")
        else:
            tags.append("SUCCESS")
        
        # Tipo B2B
        strategy = payload.get("strategy_brief", {})
        if strategy.get("segment") == "B2B":
            tags.append("B2B")
        else:
            tags.append("B2C")
        
        return list(set(tags))  # Eliminar duplicados


# Función helper para uso directo
def create_context_card(payload: Dict[str, Any]) -> ContextCard:
    """
    Helper function para crear context card directamente.
    Wrapper del método estático de la clase Canonizer.
    """
    return Canonizer.create_context_card(payload)
