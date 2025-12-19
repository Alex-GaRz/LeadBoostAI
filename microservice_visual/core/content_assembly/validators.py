"""
Content Assembly Validators - FASE 7 BLOQUE 5
Validaciones de coherencia estructural (NO creatividad, NO compliance)
"""

from typing import Optional
from contracts import VisualAsset, CopyVariant


class ContentValidator:
    """
    Validador de coherencia estructural entre visual y copy.
    Solo checks booleanos simples - sin hashing ni scoring.
    """
    
    def has_layout_match(self, visual: VisualAsset, copy: CopyVariant) -> bool:
        """
        Verifica si copy referencia el layout del visual.
        
        Regla: copy.text_content['layout_id'] debe existir en visual.layout_used
        """
        if not visual.layout_used:
            return False
        
        copy_layout_id = copy.text_content.get("layout_id")
        if not copy_layout_id:
            return False
        
        # Comparar con plan_id del layout (si existe como atributo)
        visual_layout_id = getattr(visual.layout_used, "plan_id", None)
        if not visual_layout_id:
            return False
        
        return str(copy_layout_id) == str(visual_layout_id)
    
    def has_asset_match(self, visual: VisualAsset, copy: CopyVariant) -> bool:
        """
        Verifica si copy referencia el asset_id del visual.
        
        Regla: copy.text_content['visual_asset_id'] == visual.asset_id
        """
        copy_visual_ref = copy.text_content.get("visual_asset_id")
        if not copy_visual_ref:
            return False
        
        return str(copy_visual_ref) == str(visual.asset_id)
    
    def is_complete(self, visual: VisualAsset, copy: CopyVariant) -> bool:
        """
        Verifica que ambos assets tengan campos obligatorios.
        """
        # Visual checks
        if not visual.url or visual.url.strip() == "":
            return False
        if visual.asset_id is None:
            return False
        
        # Copy checks
        if copy.variant_id is None:
            return False
        if not copy.text_content or len(copy.text_content) == 0:
            return False
        
        return True
