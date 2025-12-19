"""
Responsabilidad: El director de orquesta. Conecta todos los engines en secuencia.
Dependencias: Todos los core/engines/
"""
from contracts.payload import CampaignPayload
from contracts.artifacts import (
    VisualAsset, 
    ContentFailureReport, 
    LayoutPlan
)
from contracts.enums import Severity
from typing import List, Union, Dict, Any
from uuid import uuid4

# Engines
from ..engines.layout_engine import LayoutEngine
from ..engines.controlnet_adapter import ControlNetAdapter
from ..engines.generation_engine import GenerationEngine
from ..engines.harmonization_engine import HarmonizationEngine
from ..engines.typography_engine import TypographyEngine
from ..engines.prompt_builder import build_visual_prompt
from ..engines.validators import ImageValidator

# Adapters
from ...adapters.diffusion_client import MockDiffusionClient
from ...adapters.controlnet_client import ControlNetClient
from ...adapters.storage_client import LocalStorageClient

# Utils
from ...utils.hashing import sha256_bytes, sha256_string
from ...utils.image_ops import save_to_bytes, load_image

# Compliance
from ..compliance_bridge import ComplianceBridge


class VisualPipeline:
    """
    Orquestador principal del flujo visual.
    Ejecuta el pipeline completo desde Layout hasta Typography.
    """

    def __init__(self):
        """
        Inyección de dependencias de los engines.
        """
        # Core engines
        self.layout_engine = LayoutEngine()
        self.controlnet_adapter = ControlNetAdapter()
        self.harmonization_engine = HarmonizationEngine()
        self.typography_engine = TypographyEngine()
        
        # Diffusion
        self.diffusion_client = MockDiffusionClient()
        self.generation_engine = GenerationEngine(
            client=self.diffusion_client,
            cn_adapter=self.controlnet_adapter
        )
        
        # Validators & Compliance
        self.validator = ImageValidator()
        self.compliance_bridge = ComplianceBridge()
        
        # Storage
        self.storage_client = LocalStorageClient()

    async def run_production_flow(self, payload: CampaignPayload) -> Union[List[VisualAsset], ContentFailureReport]:
        """
        Ejecuta el flujo completo:
        1. Layout -> 2. Prompt -> 3. Gen -> 4. Harmonize -> 5. Typography -> 6. Compliance -> 7. Persist
        """
        try:
            # ═══════════════════════════════════════════════════════════
            # PASO 1 — Layout (determinista)
            # ═══════════════════════════════════════════════════════════
            try:
                # Extraer datos del payload (obligatorios)
                if not hasattr(payload, 'platform_spec') or not payload.platform_spec:
                    return ContentFailureReport(
                        reason_code="MISSING_PLATFORM_SPEC",
                        severity=Severity.CRITICAL,
                        evidence={"error": "payload.platform_spec is required", "step": "layout"}
                    )
                
                if not hasattr(payload, 'strategy_brief') or not payload.strategy_brief:
                    return ContentFailureReport(
                        reason_code="MISSING_STRATEGY_BRIEF",
                        severity=Severity.CRITICAL,
                        evidence={"error": "payload.strategy_brief is required", "step": "layout"}
                    )
                
                if not hasattr(payload, 'brand_genome') or not payload.brand_genome:
                    return ContentFailureReport(
                        reason_code="MISSING_BRAND_GENOME",
                        severity=Severity.CRITICAL,
                        evidence={"error": "payload.brand_genome is required", "step": "layout"}
                    )
                
                platform_spec = payload.platform_spec
                brief = payload.strategy_brief
                brand_genome = payload.brand_genome
                
                # Calcular layout usando LayoutEngine
                layout_plan = self.layout_engine.calculate_layout(platform_spec, brief)
                
                # Validar safe zones usando LayoutEngine
                if not self.layout_engine._validate_safe_zones(layout_plan, platform_spec):
                    return ContentFailureReport(
                        reason_code="SAFE_ZONE_VIOLATION",
                        severity=Severity.CRITICAL,
                        evidence={
                            "violations": layout_plan.safe_zone_violations,
                            "step": "layout"
                        }
                    )
            except Exception as e:
                return ContentFailureReport(
                    reason_code="LAYOUT_ERROR",
                    severity=Severity.HIGH,
                    evidence={"error": str(e), "step": "layout"}
                )
            
            # ═══════════════════════════════════════════════════════════
            # PASO 2 — Prompt Building
            # ═══════════════════════════════════════════════════════════
            try:
                seed = 42  # Mock seed determinista
                prompt_bundle = build_visual_prompt(
                    brief=brief,
                    brand_genome=brand_genome,
                    layout_plan=layout_plan,
                    seed=seed
                )
            except Exception as e:
                return ContentFailureReport(
                    reason_code="PROMPT_BUILD_ERROR",
                    severity=Severity.MEDIUM,
                    evidence={"error": str(e), "step": "prompt_building"}
                )
            
            # ═══════════════════════════════════════════════════════════
            # PASO 3 — Generación (usando GenerationEngine)
            # ═══════════════════════════════════════════════════════════
            try:
                # Obtener producto del payload
                if not hasattr(payload, 'product_asset') or not payload.product_asset:
                    return ContentFailureReport(
                        reason_code="MISSING_PRODUCT_ASSET",
                        severity=Severity.CRITICAL,
                        evidence={"error": "payload.product_asset is required", "step": "generation"}
                    )
                
                # Extraer image_bytes del product_asset
                if not hasattr(payload.product_asset, 'image_bytes') or not payload.product_asset.image_bytes:
                    return ContentFailureReport(
                        reason_code="MISSING_PRODUCT_IMAGE",
                        severity=Severity.CRITICAL,
                        evidence={"error": "payload.product_asset.image_bytes is required", "step": "generation"}
                    )
                
                product_image_bytes = payload.product_asset.image_bytes
                
                # Usar GenerationEngine (orquesta ControlNet + Diffusion)
                image_bytes, generation_metadata = await self.generation_engine.generate_base_scene(
                    prompt=prompt_bundle.positive_prompt,
                    layout=layout_plan,
                    product_image=product_image_bytes
                )
                
                # Validar imagen generada
                validation = self.validator.validate_not_blank(image_bytes)
                if not validation.passed:
                    return ContentFailureReport(
                        reason_code=validation.reason_code,
                        severity=Severity.HIGH,
                        evidence={**validation.evidence, "step": "generation"}
                    )
                
            except Exception as e:
                return ContentFailureReport(
                    reason_code="GENERATION_ERROR",
                    severity=Severity.HIGH,
                    evidence={"error": str(e), "step": "generation"}
                )
            
            # ═══════════════════════════════════════════════════════════
            # PASO 4 — Harmonization (Mock - skip por ahora)
            # ═══════════════════════════════════════════════════════════
            # harmonized_bytes = image_bytes  # Skip harmonization en mock
            
            # ═══════════════════════════════════════════════════════════
            # PASO 5 — Typography (Mock)
            # ═══════════════════════════════════════════════════════════
            try:
                # TODO: Usar TypographyEngine.render_text_overlay() cuando esté implementado
                # Por ahora skip typography - solo usar imagen base
                final_image_bytes = image_bytes
                
            except Exception as e:
                return ContentFailureReport(
                    reason_code="TEXT_RENDER_FAILED",
                    severity=Severity.MEDIUM,
                    evidence={"error": str(e), "step": "typography"}
                )
            
            # ═══════════════════════════════════════════════════════════
            # PASO 6 — Compliance
            # ═══════════════════════════════════════════════════════════
            try:
                compliance_result = self.compliance_bridge.validate(
                    layout_plan=layout_plan,
                    brand_genome=brand_genome
                )
                
                if not compliance_result.passed:
                    return ContentFailureReport(
                        reason_code=compliance_result.reason_code,
                        severity=Severity.HIGH,
                        evidence={**compliance_result.evidence, "step": "compliance"}
                    )
                    
            except Exception as e:
                return ContentFailureReport(
                    reason_code="COMPLIANCE_ERROR",
                    severity=Severity.HIGH,
                    evidence={"error": str(e), "step": "compliance"}
                )
            
            # ═══════════════════════════════════════════════════════════
            # PASO 7 — Persistencia
            # ═══════════════════════════════════════════════════════════
            try:
                # Generar asset_id
                asset_id = uuid4()
                
                # Guardar imagen
                filename = f"{asset_id}.png"
                asset_url = await self.storage_client.upload_asset(
                    file_bytes=final_image_bytes,
                    filename=filename
                )
                
                # Calcular hashes
                visual_hash = sha256_bytes(final_image_bytes)
                
                # Construir VisualAsset
                visual_asset = VisualAsset(
                    asset_id=asset_id,
                    url=asset_url,
                    layout_used=layout_plan,
                    technical_metadata={"format": "png", "visual_hash": visual_hash},
                    generation_params={"seed": seed, "model": "mock"},
                    quality_score=0.85,
                    critique_feedback=[]
                )
                
                return [visual_asset]
                
            except Exception as e:
                return ContentFailureReport(
                    reason_code="STORAGE_ERROR",
                    severity=Severity.HIGH,
                    evidence={"error": str(e), "step": "persistence"}
                )
                
        except Exception as e:
            # Catch-all para errores inesperados
            return ContentFailureReport(
                reason_code="PIPELINE_ERROR",
                severity=Severity.CRITICAL,
                evidence={"error": str(e), "step": "unknown"}
            )
