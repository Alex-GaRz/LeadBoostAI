"""
Content Assembler - FASE 7 BLOQUE 5
Ensamblaje simple 1:1 de VisualAsset + CopyVariant → ContentPackage
"""

from typing import Dict, Any
from uuid import UUID
from contracts import VisualAsset, CopyVariant, ContentPackage


class ContentAssembler:
    """
    Ensamblador simple de contenido visual + copy.
    
    Reglas:
    - Unión 1:1 (un visual + un copy = un package)
    - NO scoring ni interpretación de validaciones
    - Solo metadata mínima con IDs
    """
    
    def assemble(self, visual: VisualAsset, copy: CopyVariant) -> ContentPackage:
        """
        Ensambla un visual y un copy en un ContentPackage.
        
        Args:
            visual: Asset visual generado
            copy: Variante de copy generada
        
        Returns:
            ContentPackage listo para orquestación
        """
        # Generar ID determinístico del package
        package_id = self._generate_package_id(visual, copy)
        
        # Metadata mínima solo con IDs
        assembly_metadata = {
            "visual_asset_id": str(visual.asset_id),
            "copy_variant_id": str(copy.variant_id)
        }
        
        return ContentPackage(
            package_id=package_id,
            visual_asset=visual,
            copy_variant=copy,
            assembly_metadata=assembly_metadata,
            coherence_score=1.0,  # Default, no scoring
            validation_checks=[]
        )
    
    def _generate_package_id(self, visual: VisualAsset, copy: CopyVariant) -> UUID:
        """
        Genera UUID determinístico basado en visual_asset_id + copy_variant_id.
        """
        from hashlib import sha256
        
        combined = f"{visual.asset_id}:{copy.variant_id}"
        hash_bytes = sha256(combined.encode()).digest()
        
        return UUID(bytes=hash_bytes[:16])
