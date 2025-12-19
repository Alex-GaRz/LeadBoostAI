"""
PromptBuilder: Construcción determinista de prompts visuales.
Responsabilidad: Generar prompts para IA generativa basados en StrategyBrief + BrandGenome.
"""
from dataclasses import dataclass
from typing import Dict, Any
from contracts.payload import StrategyBrief
from contracts.artifacts import LayoutPlan
from ...utils.hashing import sha256_dict


@dataclass
class PromptBundle:
    """
    Bundle de prompts con evidencia forense.
    """
    positive_prompt: str
    negative_prompt: str
    seed: int
    prompt_hash: str
    components: Dict[str, Any]  # Para auditoría


def build_visual_prompt(
    brief: StrategyBrief,
    brand_genome: Dict[str, Any],
    layout_plan: LayoutPlan,
    seed: int
) -> PromptBundle:
    """
    Construye prompts visuales de forma determinista.
    
    Args:
        brief: StrategyBrief con visual_concept y do_not_do
        brand_genome: Diccionario con tone y reglas de marca
        layout_plan: LayoutPlan usado (para trazabilidad)
        seed: Seed para reproducibilidad
        
    Returns:
        PromptBundle con prompts construidos y hash
        
    Reglas:
        - Concatenar SOLO desde:
            * brief.visual_concept
            * brand_genome.tone
            * brief.do_not_do (para negative)
        - Negative prompt mínimo obligatorio
        - Hash SHA256 de componentes canonizados
        - Totalmente determinista
    """
    # Extraer componentes
    visual_concept = getattr(brief, 'visual_concept', '')
    do_not_do = getattr(brief, 'do_not_do', [])
    tone = brand_genome.get('tone', '')
    
    # Construir positive prompt
    positive_components = []
    if visual_concept:
        positive_components.append(visual_concept)
    if tone:
        positive_components.append(f"tone: {tone}")
    
    positive_prompt = ", ".join(positive_components) if positive_components else "professional product photography"
    
    # Construir negative prompt
    negative_base = "text, watermark, logo, blurry, low quality"
    negative_components = [negative_base]
    
    if do_not_do and isinstance(do_not_do, list):
        negative_components.extend(do_not_do)
    
    negative_prompt = ", ".join(negative_components)
    
    # Componentes para auditoría
    components = {
        "visual_concept": visual_concept,
        "tone": tone,
        "do_not_do": do_not_do,
        "seed": seed,
        "layout_id": str(layout_plan.plan_id)
    }
    
    # Hash determinista
    prompt_hash = sha256_dict({
        "positive": positive_prompt,
        "negative": negative_prompt,
        "seed": seed
    })
    
    return PromptBundle(
        positive_prompt=positive_prompt,
        negative_prompt=negative_prompt,
        seed=seed,
        prompt_hash=prompt_hash,
        components=components
    )
