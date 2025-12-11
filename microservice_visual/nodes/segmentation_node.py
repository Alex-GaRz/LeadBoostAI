"""
Segmentation Node - Product Isolation with Surgical Precision
Uses rembg (u2net) with Alpha Matting for perfect edge quality
"""

from PIL import Image
from rembg import remove
import logging
from fastapi.concurrency import run_in_threadpool
from core.interfaces import IPipelineNode, VisualContext, VisualPipelineError

logger = logging.getLogger(__name__)


class SegmentationNode(IPipelineNode):
    """
    Isolates the product from background with pixel-perfect precision.
    This is where we create the IMMUTABLE product layer.
    
    Technical Stack:
        - rembg (u2net model): State-of-the-art salient object detection
        - Alpha Matting: Soft edges for hair, glass, transparent objects
    """
    
    def __init__(
        self,
        alpha_matting: bool = True,
        alpha_matting_foreground_threshold: int = 240,
        alpha_matting_background_threshold: int = 10
    ):
        super().__init__("SegmentationNode")
        self.alpha_matting = alpha_matting
        self.alpha_matting_foreground_threshold = alpha_matting_foreground_threshold
        self.alpha_matting_background_threshold = alpha_matting_background_threshold
        
    async def process(self, context: VisualContext) -> VisualContext:
        """
        Extract product from background and generate alpha mask.
        
        Input:
            - context.raw_image: Original RGBA image
            
        Output:
            - context.mask: Binary mask (L mode)
            - context.product_layer: RGBA image with transparent background
            - context.product_hash: SHA-256 hash of visible pixels (FORENSIC)
        """
        if not context.raw_image:
            raise VisualPipelineError("raw_image is required for segmentation")
        
        logger.info(f"Segmenting product for SKU: {context.sku_id}")
        
        try:
            # CPU-bound operation: Run in thread pool to avoid blocking event loop
            def _do_segmentation():
                # Convert to RGB for rembg (it doesn't handle RGBA well)
                rgb_image = context.raw_image.convert('RGB')
                
                # Remove background with alpha matting enabled
                product_rgba = remove(
                    rgb_image,
                    alpha_matting=self.alpha_matting,
                    alpha_matting_foreground_threshold=self.alpha_matting_foreground_threshold,
                    alpha_matting_background_threshold=self.alpha_matting_background_threshold,
                    only_mask=False
                )
                
                # Ensure result is RGBA
                if isinstance(product_rgba, Image.Image):
                    if product_rgba.mode != 'RGBA':
                        product_rgba = product_rgba.convert('RGBA')
                else:
                    # If rembg returned bytes, convert to PIL Image
                    from io import BytesIO
                    product_rgba = Image.open(BytesIO(product_rgba)).convert('RGBA')
                
                # Extract alpha channel as mask
                mask = product_rgba.split()[-1]  # Get alpha channel
                
                # Calculate coverage (how much of the image is product)
                total_pixels = mask.width * mask.height
                visible_pixels = sum(1 for pixel in mask.getdata() if pixel > 0)
                coverage = (visible_pixels / total_pixels) * 100
                
                return product_rgba, mask, coverage
            
            # Execute in thread pool
            product_rgba, mask, coverage = await run_in_threadpool(_do_segmentation)
            
            # Store immutable product layer
            context.product_layer = product_rgba
            context.mask = mask
            
            # Compute forensic hash (CRITICAL INVARIANT)
            product_hash = context.compute_product_hash()
            
            context.metadata['segmentation'] = {
                'product_hash': product_hash,
                'coverage_percent': round(coverage, 2),
                'alpha_matting_enabled': self.alpha_matting
            }
            
            logger.info(
                f"Segmentation complete. Coverage: {coverage:.2f}%, "
                f"Hash: {product_hash[:16]}..."
            )
            
            # Validate that we actually found a product
            if coverage < 5:
                raise VisualPipelineError(
                    f"Product coverage too low ({coverage:.2f}%). "
                    "Image may not contain a clear product."
                )
            
            return context
            
        except Exception as e:
            raise VisualPipelineError(f"Segmentation failed: {str(e)}") from e
