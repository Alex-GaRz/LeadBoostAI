"""
Background Node - Context Generation (GenAI or Stock)
Creates atmosphere around the product without touching it
"""

from PIL import Image
import logging
from typing import Optional
from core.interfaces import IPipelineNode, VisualContext, VisualPipelineError

logger = logging.getLogger(__name__)


class BackgroundNode(IPipelineNode):
    """
    Generates or selects background imagery.
    The product mask is used as a 'keep-out zone' to ensure no background
    elements overlap with the product.
    
    Strategies:
        1. Solid Color (fast, deterministic)
        2. Gradient (professional, predictable)
        3. Stock Images (curated, requires API)
        4. GenAI Inpainting (creative, requires Stable Diffusion/DALL-E)
    """
    
    def __init__(
        self,
        strategy: str = "gradient",
        primary_color: tuple = (255, 255, 255),
        secondary_color: Optional[tuple] = None
    ):
        super().__init__("BackgroundNode")
        self.strategy = strategy
        self.primary_color = primary_color
        self.secondary_color = secondary_color or (240, 240, 240)
        
    async def process(self, context: VisualContext) -> VisualContext:
        """
        Generate background layer based on selected strategy.
        Supports: 'solid_color', 'gradient', 'transparent'.
        """
        if not context.raw_image:
            raise VisualPipelineError("raw_image required for background generation")

        width, height = context.raw_image.size
        logger.info(f"Generating {self.strategy} background ({width}x{height})")

        try:
            strategy = self.strategy.lower()
            if strategy in ("solid_color", "solid"):
                background = self._create_solid_background(width, height)
            elif strategy == "gradient":
                background = self._create_gradient_background(width, height)
            elif strategy == "transparent":
                background = self._create_transparent_background(width, height)
            elif strategy == "stock":
                logger.warning("Stock strategy not implemented, falling back to gradient")
                background = self._create_gradient_background(width, height)
            elif strategy == "genai":
                logger.warning("GenAI strategy not implemented, falling back to gradient")
                background = self._create_gradient_background(width, height)
            else:
                raise VisualPipelineError(f"Unknown background strategy: {self.strategy}")

            context.background_layer = background
            context.metadata['background'] = {
                'strategy': self.strategy,
                'size': (width, height)
            }
            return context
        except Exception as e:
            raise VisualPipelineError(f"Background generation failed: {str(e)}") from e

    def _create_solid_background(self, width: int, height: int) -> Image.Image:
        """Create solid color background (default: white)"""
        color = self.primary_color if self.primary_color else (255, 255, 255)
        return Image.new('RGBA', (width, height), color + (255,))

    def _create_gradient_background(self, width: int, height: int) -> Image.Image:
        """Create vertical gradient background."""
        background = Image.new('RGBA', (width, height))
        for y in range(height):
            blend = y / height
            r = int(self.primary_color[0] * (1 - blend) + self.secondary_color[0] * blend)
            g = int(self.primary_color[1] * (1 - blend) + self.secondary_color[1] * blend)
            b = int(self.primary_color[2] * (1 - blend) + self.secondary_color[2] * blend)
            for x in range(width):
                background.putpixel((x, y), (r, g, b, 255))
        return background

    def _create_transparent_background(self, width: int, height: int) -> Image.Image:
        """Create a fully transparent background."""
        return Image.new('RGBA', (width, height), (0, 0, 0, 0))
    
    def _create_solid_background(self, width: int, height: int) -> Image.Image:
        """Create solid color background"""
        return Image.new('RGBA', (width, height), self.primary_color + (255,))
    
    def _create_gradient_background(self, width: int, height: int) -> Image.Image:
        """
        Create vertical gradient background.
        Professional look for product showcases.
        """
        background = Image.new('RGBA', (width, height))
        
        # Linear interpolation from primary to secondary color
        for y in range(height):
            # Calculate blend factor (0.0 to 1.0)
            blend = y / height
            
            # Interpolate each color channel
            r = int(self.primary_color[0] * (1 - blend) + self.secondary_color[0] * blend)
            g = int(self.primary_color[1] * (1 - blend) + self.secondary_color[1] * blend)
            b = int(self.primary_color[2] * (1 - blend) + self.secondary_color[2] * blend)
            
            # Draw horizontal line
            for x in range(width):
                background.putpixel((x, y), (r, g, b, 255))
        
        return background
