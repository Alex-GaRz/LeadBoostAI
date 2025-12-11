"""
Input Node - Asset Loading and Validation
First stage of the pipeline: Load raw images and validate them
"""

from pathlib import Path
from PIL import Image
import logging
from fastapi.concurrency import run_in_threadpool
from core.interfaces import IPipelineNode, VisualContext, VisualPipelineError

logger = logging.getLogger(__name__)


class InputNode(IPipelineNode):
    """
    Loads and validates raw product images.
    Ensures the input meets minimum quality requirements.
    """
    
    def __init__(self, assets_dir: str = "assets"):
        super().__init__("InputNode")
        self.assets_dir = Path(assets_dir)
    
    @staticmethod
    def _safe_name(filename: str) -> str:
        """
        Sanitize filename to prevent path traversal attacks.
        Only returns the filename component without any directory traversal.
        """
        return Path(filename).name
        
    async def process(self, context: VisualContext) -> VisualContext:
        """
        Load the raw product image from filesystem or URL.
        
        Expected input:
            - context.sku_id must be set
            - Image should exist at {assets_dir}/{sku_id}.png (or .jpg)
        
        Output:
            - context.raw_image: PIL Image object
        """
        logger.info(f"Loading asset for SKU: {context.sku_id}")
        
        # Sanitize SKU ID to prevent path traversal
        safe_sku_id = self._safe_name(context.sku_id)
        
        # Try multiple extensions
        possible_paths = [
            self.assets_dir / f"{safe_sku_id}.png",
            self.assets_dir / f"{safe_sku_id}.jpg",
            self.assets_dir / f"{safe_sku_id}.jpeg",
            self.assets_dir / f"{safe_sku_id}.webp"
        ]
        
        image_path = None
        for path in possible_paths:
            if path.exists():
                image_path = path
                break
        
        if not image_path:
            raise VisualPipelineError(
                f"No image found for SKU {context.sku_id}. "
                f"Searched: {[str(p) for p in possible_paths]}"
            )
        
        try:
            # CPU-bound I/O operation: Run in thread pool
            def _load_and_validate():
                # Load image
                raw_image = Image.open(image_path)
                
                # Convert to RGBA if necessary (ensure alpha channel)
                if raw_image.mode != 'RGBA':
                    raw_image = raw_image.convert('RGBA')
                
                # Validate minimum dimensions
                min_width, min_height = 512, 512
                if raw_image.width < min_width or raw_image.height < min_height:
                    raise VisualPipelineError(
                        f"Image too small: {raw_image.width}x{raw_image.height}. "
                        f"Minimum required: {min_width}x{min_height}"
                    )
                
                return raw_image
            
            raw_image = await run_in_threadpool(_load_and_validate)
            
            context.raw_image = raw_image
            context.metadata['input_path'] = str(image_path)
            context.metadata['input_size'] = (raw_image.width, raw_image.height)
            
            logger.info(
                f"Loaded image: {image_path.name} "
                f"({raw_image.width}x{raw_image.height})"
            )
            
            return context
            
        except Exception as e:
            raise VisualPipelineError(f"Failed to load image: {str(e)}") from e
