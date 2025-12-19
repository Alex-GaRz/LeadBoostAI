"""
CopyEngine: Generador de variantes de copy determinista.
Responsabilidad: Generar variantes de texto para campañas basadas en StrategyBrief + BrandGenome.
"""
from dataclasses import dataclass
from typing import List, Dict, Any
from uuid import uuid4
from contracts.artifacts import StrategyBrief
from contracts.artifacts import CopyVariant, LayoutPlan
from microservice_copy.core.utils.hashing import sha256_string, sha256_dict


class CopyEngine:
    """
    Motor de generación de variantes de copy.
    Versión stub determinista (sin LLM real).
    """
    
    def generate_variants(
        self,
        strategy_brief: StrategyBrief,
        brand_genome: Dict[str, Any],
        layout_plan: LayoutPlan,
        seed: int,
        visual_asset_id: str = None
    ) -> List[CopyVariant]:
        """
        Genera variantes deterministas de copy basadas en brief y brand genome.
        
        Args:
            strategy_brief: Brief estratégico con objetivos y tono
            brand_genome: Reglas de marca (tone, voice, forbidden_words)
            layout_plan: LayoutPlan para respetar límites de texto
            seed: Seed para reproducibilidad
            visual_asset_id: ID del VisualAsset asociado (opcional)
            
        Returns:
            List[CopyVariant]: 2-3 variantes deterministas
            
        TODO: Reemplazar con LLM real que:
            - Use strategy_brief para contexto
            - Respete brand_genome.tone
            - Genere múltiples ángulos creativos
            - Respete text_limits del layout
        """
        # Extraer datos del brief
        objective = getattr(strategy_brief, 'objective', 'Producto de calidad')
        tone = brand_genome.get('tone', 'professional')
        
        # Generar variantes deterministas (mock)
        variants = []
        
        # Variante 1: Directo
        variant1 = self._create_variant(
            headline=f"{objective} - Descubre más",
            body=f"Experimenta la diferencia con nuestro {objective}. Calidad garantizada.",
            cta="Comprar ahora",
            tone=tone,
            angle="direct",
            seed=seed,
            layout_plan=layout_plan,
            visual_asset_id=visual_asset_id
        )
        variants.append(variant1)
        
        # Variante 2: Emocional
        variant2 = self._create_variant(
            headline=f"Transforma tu experiencia",
            body=f"Únete a miles que ya confían en nosotros. {objective} diseñado para ti.",
            cta="Descubre cómo",
            tone=tone,
            angle="emotional",
            seed=seed + 1,
            layout_plan=layout_plan,
            visual_asset_id=visual_asset_id
        )
        variants.append(variant2)
        
        # Variante 3: Urgencia
        variant3 = self._create_variant(
            headline=f"Oferta exclusiva por tiempo limitado",
            body=f"No pierdas la oportunidad de tener {objective}. Stock limitado.",
            cta="Aprovechar oferta",
            tone=tone,
            angle="urgency",
            seed=seed + 2,
            layout_plan=layout_plan,
            visual_asset_id=visual_asset_id
        )
        variants.append(variant3)
        
        return variants
    
    def _create_variant(
        self,
        headline: str,
        body: str,
        cta: str,
        tone: str,
        angle: str,
        seed: int,
        layout_plan: LayoutPlan,
        visual_asset_id: str = None
    ) -> CopyVariant:
        """
        Crea una CopyVariant con metadata completa.
        
        Args:
            headline: Título del copy
            body: Cuerpo del copy
            cta: Call to action
            tone: Tono de la variante
            angle: Ángulo creativo
            seed: Seed usado
            layout_plan: Layout plan asociado
            visual_asset_id: ID del visual asset (opcional)
            
        Returns:
            CopyVariant con metadata y hashes
        """
        # Calcular content_hash determinista
        content_data = {
            "headline": headline,
            "body": body,
            "cta": cta,
            "tone": tone,
            "angle": angle,
            "seed": seed,
            "layout_id": str(layout_plan.plan_id)
        }
        content_hash = sha256_dict(content_data)
        
        # Generar variant_id determinista desde content_hash
        from uuid import UUID
        variant_id = UUID(content_hash[:32])
        
        # Calcular tone_score simple (mock)
        tone_score = 0.85
        
        return CopyVariant(
            variant_id=variant_id,
            headline=headline,
            body=body,
            cta=cta,
            tone=tone,
            angle=angle,
            content_hash=content_hash,
            layout_id=layout_plan.plan_id,
            visual_asset_id=visual_asset_id,
            tags={"angle_tag": angle, "tone_tag": tone},
            tone_score=tone_score,
            risk_flags=[],
            rationale="Mock validation - deterministic stub"
        )
