"""
Typography Node - Pixel-Perfect Text Rendering
Uses Playwright (headless browser) to render HTML/CSS with brand fidelity
"""

from PIL import Image
from pathlib import Path
from jinja2 import Template
import logging
import asyncio
from typing import Optional
from core.interfaces import IPipelineNode, VisualContext, VisualPipelineError

logger = logging.getLogger(__name__)


class TypographyNode(IPipelineNode):
    """
    Renders promotional text with pixel-perfect accuracy.
    
    Why not PIL.ImageDraw?
        - No kerning control
        - Limited font support
        - No advanced CSS features (shadows, gradients, transforms)
    
    Why Playwright?
        - Real browser rendering engine (Chromium)
        - Perfect CSS support (including WOFF2 web fonts)
        - Respects brand guidelines exactly as designers see them
    """
    
    def __init__(self, templates_dir: str = "templates"):
        super().__init__("TypographyNode")
        self.templates_dir = Path(templates_dir)
        self._browser = None
        self._playwright = None
        
    async def _ensure_browser(self):
        """Lazy initialization of Playwright browser"""
        if self._browser is None:
            from playwright.async_api import async_playwright
            self._playwright = await async_playwright().start()
            self._browser = await self._playwright.chromium.launch(headless=True)
            logger.info("Playwright browser initialized")
    
    async def _cleanup_browser(self):
        """Cleanup browser resources"""
        if self._browser:
            await self._browser.close()
            self._browser = None
        if self._playwright:
            await self._playwright.stop()
            self._playwright = None
    
    async def process(self, context: VisualContext) -> VisualContext:
        """
        Render text layer using headless browser.
        
        Input:
            - context.campaign_type: Template selector (e.g., "promo_retail")
            - context.campaign_copy: Text to render
            - context.sku_price: For price display
            - context.sku_discount: For discount badges
            
        Output:
            - context.text_layer: RGBA image with rendered text
        """
        if not context.campaign_copy:
            logger.warning("No campaign copy provided, skipping typography")
            # Create transparent placeholder
            if context.raw_image:
                width, height = context.raw_image.size
                context.text_layer = Image.new('RGBA', (width, height), (0, 0, 0, 0))
            return context
        
        logger.info(f"Rendering typography for campaign: {context.campaign_type}")
        
        try:
            await self._ensure_browser()
            
            # Load template
            template_path = self.templates_dir / f"{context.campaign_type}.html"
            if not template_path.exists():
                logger.warning(f"Template {template_path} not found, using default")
                template_path = self.templates_dir / "promo_retail.html"
            
            if not template_path.exists():
                raise VisualPipelineError(
                    f"No templates found in {self.templates_dir}. "
                    "Please create at least promo_retail.html"
                )
            
            # Render template with Jinja2
            with open(template_path, 'r', encoding='utf-8') as f:
                template = Template(f.read())
            
            html_content = template.render(
                copy_text=context.campaign_copy,
                price=context.sku_price,
                discount=context.sku_discount,
                product_name=context.sku_name,
                sku_id=context.sku_id
            )
            
            # Create new page
            page = await self._browser.new_page(
                viewport={'width': context.raw_image.width, 'height': context.raw_image.height}
            )
            
            try:
                # Set transparent background
                await page.set_content(html_content)
                
                # Take screenshot
                screenshot_bytes = await page.screenshot(type='png', omit_background=True)
                
                # Convert to PIL Image
                from io import BytesIO
                text_layer = Image.open(BytesIO(screenshot_bytes)).convert('RGBA')
                
                context.text_layer = text_layer
                context.metadata['typography'] = {
                    'template': template_path.name,
                    'rendered_size': (text_layer.width, text_layer.height)
                }
                
                logger.info(f"Typography rendered successfully using {template_path.name}")
                
                return context
                
            finally:
                # Always close page, even if error occurs
                await page.close()
            
        except Exception as e:
            raise VisualPipelineError(f"Typography rendering failed: {str(e)}") from e
