import asyncio
import os
import json
from typing import Dict, Any, List, Literal
from dotenv import load_dotenv
from openai import AsyncOpenAI
from pydantic import BaseModel

# Cargar variables de entorno
load_dotenv()

# Cliente OpenAI
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --- CONFIGURACIÓN DE PERSISTENCIA ---
# Aquí se guardarán los archivos para no volver a pagar por ellos
STORAGE_DIR = "data_store/blueprints"
os.makedirs(STORAGE_DIR, exist_ok=True)

# --- CONTEXTO MOCK (Para guiar a la IA) ---
STRATEGY_CONTEXTS = {
    "TEST-ID-001": {
        "topic": "Productos de Hogar Eco-Friendly y Sostenibles",
        "detected_signal": "Tendencia viral en TikTok sobre 'Cocina Zero Waste'",
        "goal": "Venta directa (Conversión)"
    },
    "TEST-ID-002": {
        "topic": "SaaS de Productividad para Desarrolladores",
        "detected_signal": "Quejas en Twitter sobre precios altos de la competencia",
        "goal": "Captación de Leads (Free Trial)"
    },
    "DEFAULT": {
        "topic": "Servicio de Consultoría Genérico",
        "detected_signal": "Aumento de búsquedas en Google Trends",
        "goal": "Branding"
    }
}

# --- SCHEMAS DE DATOS ---
class VisualAsset(BaseModel):
    url: str
    type: Literal["image/png", "image/jpeg"] = "image/png"

class AdCopy(BaseModel):
    headline: str
    body: str

class Segmentation(BaseModel):
    persona: str
    demographics: str
    interests: List[str]

class Explanations(BaseModel):
    why_image: str
    why_text: str
    why_segmentation: str

class Financials(BaseModel):
    expected_roi: float
    budget: int

class DebugMeta(BaseModel):
    model: str = "gpt-4o-mini + dall-e-3"
    latency: str
    source: str = "GENERATED" # Nuevo campo para saber si vino de caché o IA

class CampaignBlueprint(BaseModel):
    strategy_id: str
    status: Literal["READY_FOR_APPROVAL", "REGENERATING", "ERROR"]
    visual_asset: VisualAsset
    ad_copy: AdCopy
    segmentation: Segmentation
    brand_context: str          
    trend_signals: List[str]    
    quality_score: int          
    explanations: Explanations
    financials: Financials
    debug_meta: DebugMeta

# --- FUNCIONES DE IA (SOLO SE LLAMAN SI NO HAY CACHÉ) ---

async def generate_analysis_data(context: Dict[str, str]):
    prompt = f"""
    Actúa como Estratega de Marketing. Analiza:
    - Tema: {context['topic']}
    - Señal: {context['detected_signal']}
    
    JSON Estricto:
    {{
        "persona": "Arquetipo",
        "demographics": "Detalles",
        "interests": ["A", "B"],
        "brand_context": "Contexto",
        "trend_signals": ["Trend 1"],
        "why_segmentation": "Justificación"
    }}
    """
    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": "JSON output only."}, {"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except:
        return {"persona": "Error", "interests": []}

async def generate_creative_data(context: Dict[str, str], persona: str):
    prompt = f"""
    Actúa como Director Creativo. Anuncio para {context['topic']} dirigido a {persona}.
    
    JSON Estricto:
    {{
        "headline": "Titular (max 50 chars)",
        "body_copy": "Cuerpo (max 200 chars)",
        "image_prompt": "Prompt DALL-E 3 detallado.",
        "why_image": "Justificación visual",
        "why_text": "Justificación copy"
    }}
    """
    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": "JSON output only."}, {"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except:
        return {"headline": "Error", "body_copy": "Error", "image_prompt": "Error"}

async def generate_image_dalle(image_prompt: str):
    try:
        response = await client.images.generate(
            model="dall-e-3",
            prompt=image_prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        return response.data[0].url
    except:
        return "https://via.placeholder.com/1024x1024?text=Error+DALLE"

# --- AGREGADOR CON PERSISTENCIA ---

class StrategyAggregator:
    def __init__(self, bff_url: str = "http://localhost:8000"):
        self.bff_url = bff_url

    def _get_file_path(self, strategy_id: str) -> str:
        # Limpia el ID para que sea un nombre de archivo válido
        safe_id = "".join([c for c in strategy_id if c.isalnum() or c in ('-', '_')])
        return os.path.join(STORAGE_DIR, f"{safe_id}.json")

    def _normalize_asset_url(self, url: str) -> str:
        if url.startswith("http"): return url
        if url.startswith('./assets/'):
            filename = url.split('./assets/')[1]
            return f"{self.bff_url}/static/{filename}"
        return url

    async def get_strategy_blueprint(self, strategy_id: str, force_regenerate: bool = False) -> CampaignBlueprint:
        file_path = self._get_file_path(strategy_id)
        
        # 1. VERIFICAR CACHÉ EN DISCO (Coste $0)
        # Si el archivo existe Y NO estamos forzando regeneración, lo leemos del disco.
        if os.path.exists(file_path) and not force_regenerate:
            print(f"💾 DISK CACHE: Cargando {strategy_id} desde archivo local.")
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # Marcamos que vino de caché para debug
                    if 'debug_meta' in data:
                        data['debug_meta']['source'] = 'DISK_CACHE'
                    return CampaignBlueprint(**data)
            except Exception as e:
                print(f"⚠️ Error leyendo caché, regenerando: {e}")

        # 2. GENERAR (Coste $$$) - Solo si no existe o force_regenerate=True
        print(f"💸 GENERATING: Creando nueva estrategia para {strategy_id} (Llamada a API)...")
        loop = asyncio.get_event_loop()
        start = loop.time()
        
        context = STRATEGY_CONTEXTS.get(strategy_id, STRATEGY_CONTEXTS["DEFAULT"])
        
        analyst_data = await generate_analysis_data(context)
        creative_data = await generate_creative_data(context, analyst_data.get("persona", "Cliente"))
        
        # Llamada costosa a DALL-E
        image_url = await generate_image_dalle(creative_data.get("image_prompt", "Product"))
        
        import random
        roi = round(random.uniform(2.5, 4.5), 2)
        quality_score = int(random.uniform(80, 98))
        
        end = loop.time()
        
        blueprint = CampaignBlueprint(
            strategy_id=strategy_id,
            status="READY_FOR_APPROVAL",
            visual_asset=VisualAsset(url=image_url, type="image/png"),
            ad_copy=AdCopy(
                headline=creative_data.get("headline", "N/A"),
                body=creative_data.get("body_copy", "N/A")
            ),
            segmentation=Segmentation(
                persona=analyst_data.get("persona", "N/A"),
                demographics=analyst_data.get("demographics", "N/A"),
                interests=analyst_data.get("interests", [])
            ),
            brand_context=analyst_data.get("brand_context", "N/A"),
            trend_signals=analyst_data.get("trend_signals", []),
            quality_score=quality_score,
            explanations=Explanations(
                why_image=creative_data.get("why_image", "N/A"),
                why_text=creative_data.get("why_text", "N/A"),
                why_segmentation=analyst_data.get("why_segmentation", "N/A")
            ),
            financials=Financials(expected_roi=roi, budget=500),
            debug_meta=DebugMeta(
                latency=f"{round(end-start, 2)}s",
                source="OPENAI_API"
            )
        )

        # 3. GUARDAR EN DISCO
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                # Convertimos el modelo Pydantic a JSON
                f.write(blueprint.model_dump_json(indent=2))
            print(f"✅ SAVED: Estrategia guardada en {file_path}")
        except Exception as e:
            print(f"❌ Error guardando en disco: {e}")

        return blueprint

# Shim
class AggregatorService:
    pass