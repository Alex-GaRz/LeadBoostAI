from fastapi import APIRouter, HTTPException
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text
import os
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(tags=["Computer Vision"])

# Configuración de DB - Debe venir de ENV
# Ejemplo: postgresql+asyncpg://user:pass@localhost:5432/leadboost_db
DB_URL = os.getenv("DB_CONNECTION_STRING", "postgresql+asyncpg://postgres:postgres@localhost:5432/leadboost_vision")

# Crear motor asíncrono (Pool de conexiones)
engine = create_async_engine(DB_URL, echo=False)

class VisionSignal(BaseModel):
    id: str
    source: str
    content_text: Optional[str] = None
    url: Optional[str] = None
    sentiment_score: Optional[float] = 0.0
    created_at: Optional[str] = None


# EN: backend/microservice_bff/routers/vision.py
@router.get("/signals", response_model=List[VisionSignal])
async def get_visual_signals():
    """
    Intenta leer de DB, si falla, devuelve datos MOCK para que el frontend no se rompa.
    """
    # 1. Intentamos leer de la DB real
    try:
        query = text("""
            SELECT id, source, content_text, original_url as url, 
                   COALESCE((analysis->>'sentimentScore')::float, 0.0) as sentiment_score, 
                   created_at::text
            FROM raw_signals 
            WHERE source IN ('tiktok', 'instagram_reels', 'youtube_shorts')
            ORDER BY created_at DESC 
            LIMIT 10
        """)
        
        async with engine.connect() as conn:
            result = await conn.execute(query)
            rows = result.fetchall()
            
            signals = []
            for row in rows:
                signals.append(VisionSignal(
                    id=str(row.id),
                    source=row.source,
                    content_text=row.content_text[:200] if row.content_text else "",
                    url=row.url,
                    sentiment_score=row.sentiment_score,
                    created_at=row.created_at
                ))
            return signals

    except Exception as e:
        print(f"⚠️ [Vision] DB Error (Usando Mock Data): {e}")
        # 2. FALLBACK: Datos simulados si la DB falla (para que veas algo en pantalla)
        return [
            VisionSignal(
                id="mock-01",
                source="tiktok",
                content_text="[MOCK] Video viral simulado porque la DB falló auth.",
                url="http://tiktok.com",
                sentiment_score=0.9,
                created_at="2023-10-27 10:00:00"
            ),
            VisionSignal(
                id="mock-02",
                source="instagram_reels",
                content_text="[MOCK] Segundo video de prueba del sistema de visión.",
                url="http://instagram.com",
                sentiment_score=-0.4,
                created_at="2023-10-27 09:30:00"
            )
        ]

# Endpoint de debug para verificar conexión
@router.get("/health")
async def db_health():
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "connected", "database": "PostgreSQL"}
    except Exception as e:
        return {"status": "disconnected", "error": str(e)}
