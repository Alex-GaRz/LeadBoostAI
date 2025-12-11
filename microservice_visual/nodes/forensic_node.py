"""
Forensic Node - OCR Validation (PERMISSIVE MODE)
"""

from PIL import Image
import logging
import re
from typing import Optional, List, Dict
from fastapi.concurrency import run_in_threadpool
from core.interfaces import IPipelineNode, VisualContext, VisualPipelineError

logger = logging.getLogger(__name__)

class ForensicNode(IPipelineNode):
    def __init__(
        self,
        strict_mode: bool = False, # Por defecto Falso para no bloquear
        ocr_engine: str = "tesseract"
    ):
        super().__init__("ForensicNode")
        self.strict_mode = strict_mode
        self.ocr_engine = ocr_engine
        
    async def process(self, context: VisualContext) -> VisualContext:
        logger.info(f"Running forensic validation for SKU: {context.sku_id}")
        
        # Si no hay composición final, nada que validar
        if not context.final_composition:
            logger.warning("No final composition to validate")
            return context

        # Ejecutar OCR en thread separado
        extracted_text = await self._extract_text(context.final_composition)
        
        # Extraer datos
        found_prices = self._parse_prices(extracted_text)
        found_discounts = self._parse_discounts(extracted_text)
        
        # Validar (Lógica de Negocio)
        price_valid = self._validate_price(found_prices, context.sku_price, context.sku_discount)
        
        # REPORTE (Sin excepciones)
        report = {
            "status": "PASS" if price_valid else "WARNING", # Nunca FAIL por ahora
            "extracted_text": extracted_text,
            "found_prices": found_prices,
            "found_discounts": found_discounts,
            "expected_price": context.sku_price,
            "price_validation": price_valid
        }
        
        context.metadata['forensic_report'] = report
        
        if price_valid:
            logger.info("Forensic validation: PASS")
        else:
            # AQUÍ ESTÁ LA CLAVE: Solo logueamos warning, no lanzamos error
            logger.warning(
                f"Forensic validation WARNING:\n"
                f"Expected price: ${context.sku_price}\n"
                f"Found prices: {found_prices}"
            )

        return context
    
    async def _extract_text(self, image: Image.Image) -> str:
        # Wrapper para Tesseract
        import pytesseract
        
        def _ocr():
            # Convertir a RGB para asegurar compatibilidad
            rgb_image = image.convert('RGB')
            # Configuración optimizada para números
            custom_config = r'--oem 3 --psm 6' 
            return pytesseract.image_to_string(rgb_image, config=custom_config)
            
        return await run_in_threadpool(_ocr)

    def _parse_prices(self, text: str) -> List[float]:
        # Busca patrones tipo $100.00, 100.00, 1,200.50
        prices = []
        # Regex mejorado para capturar precios con o sin símbolo $
        matches = re.findall(r'\$?\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', text)
        for match in matches:
            try:
                # Limpiar comas y convertir
                clean_match = match.replace(',', '')
                val = float(clean_match)
                if val > 0: # Ignorar ceros
                    prices.append(val)
            except ValueError:
                continue
        return prices

    def _parse_discounts(self, text: str) -> List[float]:
        # Busca 20%, 50% OFF
        discounts = []
        matches = re.findall(r'(\d{1,2})\s?%', text)
        for match in matches:
            try:
                discounts.append(float(match))
            except ValueError:
                continue
        return discounts

    def _validate_price(self, found: List[float], expected: float, discount: Optional[float]) -> bool:
        if not found: return False
        targets = [expected]
        if discount:
            targets.append(round(expected * (1 - discount/100), 2))
        
        for t in targets:
            for f in found:
                # Tolerancia de $1.00 por errores de OCR
                if abs(f - t) <= 1.0:
                    return True
        return False