"""
Content Pipeline - FASE 7 BLOQUE 5
Orquestación del ensamblaje de contenido con matching explícito por IDs
"""

from typing import Union, List
from contracts import (
    VisualAsset,
    CopyVariant,
    ContentPackage,
    ContentFailureReport,
    Severity
)
from .assembler import ContentAssembler
from .validators import ContentValidator


class ContentPipeline:
    """
    Pipeline de ensamblaje de contenido.
    
    Estrategia de matching:
    - Busca copy donde layout_id == visual.layout_used.plan_id
    - O donde visual_asset_id == visual.asset_id
    - Si no hay match → ContentFailureReport
    """
    
    def __init__(self):
        self.validator = ContentValidator()
        self.assembler = ContentAssembler()
    
    async def assemble_content(
        self,
        visual_assets: List[VisualAsset],
        copy_variants: List[CopyVariant]
    ) -> Union[List[ContentPackage], ContentFailureReport]:
        """
        Ensambla visuals con copies mediante matching explícito por IDs.
        
        Args:
            visual_assets: Lista de VisualAssets generados
            copy_variants: Lista de CopyVariants generados
        
        Returns:
            List[ContentPackage] en éxito
            ContentFailureReport si no encuentra matches
        """
        # Validación: inputs no vacíos
        if not visual_assets or len(visual_assets) == 0:
            return ContentFailureReport(
                reason_code="NO_VISUAL_ASSETS",
                severity=Severity.CRITICAL,
                evidence={"visual_count": 0},
                failed_checks=["input_validation"]
            )
        
        if not copy_variants or len(copy_variants) == 0:
            return ContentFailureReport(
                reason_code="NO_COPY_VARIANTS",
                severity=Severity.CRITICAL,
                evidence={"copy_count": 0},
                failed_checks=["input_validation"]
            )
        
        packages = []
        unmatched_visuals = []
        
        for visual in visual_assets:
            # Verificar completeness del visual
            if not self.validator.is_complete(visual, copy_variants[0]):  # Check visual solo
                return ContentFailureReport(
                    reason_code="INCOMPLETE_VISUAL",
                    severity=Severity.CRITICAL,
                    evidence={"visual_asset_id": str(visual.asset_id)},
                    failed_checks=["completeness"]
                )
            
            # Buscar copy que haga match
            matched_copy = None
            
            for copy in copy_variants:
                # Verificar completeness del copy
                if not self.validator.is_complete(visual, copy):
                    continue  # Skip incomplete copies
                
                # Intentar match por layout_id
                if self.validator.has_layout_match(visual, copy):
                    matched_copy = copy
                    break
                
                # Intentar match por asset_id
                if self.validator.has_asset_match(visual, copy):
                    matched_copy = copy
                    break
            
            # Si no hay match, fallo
            if matched_copy is None:
                unmatched_visuals.append(str(visual.asset_id))
                continue
            
            # Ensamblar package
            package = self.assembler.assemble(visual, matched_copy)
            packages.append(package)
        
        # Si hay visuals sin match, retornar fallo
        if unmatched_visuals:
            return ContentFailureReport(
                reason_code="NO_MATCHING_COPY",
                severity=Severity.CRITICAL,
                evidence={
                    "unmatched_visual_ids": unmatched_visuals,
                    "total_visuals": len(visual_assets),
                    "total_copies": len(copy_variants),
                    "packages_created": len(packages)
                },
                failed_checks=["layout_match", "asset_match"]
            )
        
        # Si no se creó ningún package, fallo
        if not packages:
            return ContentFailureReport(
                reason_code="NO_PACKAGES_ASSEMBLED",
                severity=Severity.CRITICAL,
                evidence={
                    "visual_count": len(visual_assets),
                    "copy_count": len(copy_variants)
                },
                failed_checks=["assembly"]
            )
        
        return packages
    
    async def assemble_single(
        self,
        visual: VisualAsset,
        copy: CopyVariant
    ) -> Union[ContentPackage, ContentFailureReport]:
        """
        Ensambla un único par visual + copy con verificación de match.
        
        Args:
            visual: VisualAsset generado
            copy: CopyVariant generado
        
        Returns:
            ContentPackage en éxito, ContentFailureReport en fallo
        """
        # Verificar completeness
        if not self.validator.is_complete(visual, copy):
            return ContentFailureReport(
                reason_code="INCOMPLETE_CONTENT",
                severity=Severity.CRITICAL,
                evidence={
                    "visual_asset_id": str(visual.asset_id),
                    "copy_variant_id": str(copy.variant_id)
                },
                failed_checks=["completeness"]
            )
        
        # Verificar match (layout_id o asset_id)
        has_match = (
            self.validator.has_layout_match(visual, copy) or
            self.validator.has_asset_match(visual, copy)
        )
        
        if not has_match:
            return ContentFailureReport(
                reason_code="NO_MATCH",
                severity=Severity.CRITICAL,
                evidence={
                    "visual_asset_id": str(visual.asset_id),
                    "copy_variant_id": str(copy.variant_id),
                    "layout_match": False,
                    "asset_match": False
                },
                failed_checks=["layout_match", "asset_match"]
            )
        
        # Ensamblar
        package = self.assembler.assemble(visual, copy)
        return package
