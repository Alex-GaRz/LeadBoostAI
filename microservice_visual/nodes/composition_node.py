"""
Composition Node - Layer Assembly with Pixel Immutability
Combines all layers into final output (Background + Product + Text)
"""

from PIL import Image
import logging
from core.interfaces import IPipelineNode, VisualContext, VisualPipelineError

logger = logging.getLogger(__name__)


class CompositionNode(IPipelineNode):
    """
    Assembles final image from layers using alpha compositing.
    
    CRITICAL INVARIANT:
        The product_layer is NEVER modified. Only positioned and composited.
        Any filter, distortion, or color adjustment is STRICTLY FORBIDDEN.
    
    Layer Order (bottom to top):
        1. Background
        2. Product (IMMUTABLE)
        3. Text/Graphics
    """
    
    def __init__(
        self,
        product_position: str = "center",
        output_size: tuple = None
    ):
        super().__init__("CompositionNode")
        self.product_position = product_position
        self.output_size = output_size
        
    async def process(self, context: VisualContext) -> VisualContext:
        """
        Composite all layers into final image.
        
        Input:
            - context.background_layer: RGBA background
            - context.product_layer: RGBA product (MUST NOT BE MODIFIED)
            - context.text_layer: RGBA text overlay (optional)
            
        Output:
            - context.final_composition: RGBA final image
        """
        if not context.background_layer:
            raise VisualPipelineError("background_layer required for composition")
        if not context.product_layer:
            raise VisualPipelineError("product_layer required for composition")
        
        logger.info(f"Compositing layers for SKU: {context.sku_id}")
        
        try:
            # Determine output size
            if self.output_size:
                width, height = self.output_size
            else:
                width, height = context.background_layer.size
            
            # Create canvas
            canvas = Image.new('RGBA', (width, height), (0, 0, 0, 0))
            
            # Layer 1: Background
            canvas.alpha_composite(context.background_layer, (0, 0))
            
            # Layer 2: Product (IMMUTABLE - only positioning allowed)
            product_x, product_y = self._calculate_product_position(
                canvas.size,
                context.product_layer.size
            )
            canvas.alpha_composite(context.product_layer, (product_x, product_y))
            
            # Layer 3: Text (if exists)
            if context.text_layer:
                canvas.alpha_composite(context.text_layer, (0, 0))
            
            # Store final composition
            context.final_composition = canvas
            
            # Validate product integrity after composition
            # Recompute hash to ensure product wasn't altered
            original_hash = context.product_hash
            current_hash = context.compute_product_hash()
            
            if original_hash != current_hash:
                raise VisualPipelineError(
                    "CRITICAL: Product hash mismatch after composition. "
                    f"Expected: {original_hash}, Got: {current_hash}. "
                    "Product layer was modified!"
                )
            
            context.metadata['composition'] = {
                'canvas_size': (width, height),
                'product_position': (product_x, product_y),
                'product_integrity_verified': True
            }
            
            logger.info(
                f"Composition complete. Canvas: {width}x{height}, "
                f"Product at: ({product_x}, {product_y})"
            )
            
            return context
            
        except Exception as e:
            raise VisualPipelineError(f"Composition failed: {str(e)}") from e
    
    def _calculate_product_position(
        self,
        canvas_size: tuple,
        product_size: tuple
    ) -> tuple:
        """
        Calculate product position based on strategy.
        
        Strategies:
            - center: Dead center
            - center-left: Centered vertically, 1/3 from left
            - bottom-center: Centered horizontally, near bottom
        """
        canvas_w, canvas_h = canvas_size
        product_w, product_h = product_size
        
        if self.product_position == "center":
            x = (canvas_w - product_w) // 2
            y = (canvas_h - product_h) // 2
        elif self.product_position == "center-left":
            x = canvas_w // 3 - product_w // 2
            y = (canvas_h - product_h) // 2
        elif self.product_position == "center-right":
            x = (2 * canvas_w) // 3 - product_w // 2
            y = (canvas_h - product_h) // 2
        elif self.product_position == "bottom-center":
            x = (canvas_w - product_w) // 2
            y = canvas_h - product_h - 50  # 50px padding from bottom
        else:
            # Default to center
            x = (canvas_w - product_w) // 2
            y = (canvas_h - product_h) // 2
        
        return (x, y)
