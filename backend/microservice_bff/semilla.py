import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# CONFIGURACIÓN: Asegúrate de que esto coincide con lo que tienes en tu .env o vision.py
# Si usas contraseña, ponla. Ejemplo: postgresql+asyncpg://admin:password_seguro_123@localhost:5432/leadboost_cold_store
DB_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://admin:password_seguro_123@localhost:5432/leadboost_cold_store")

async def seed_data():
    engine = create_async_engine(DB_URL)
    
    print("🌱 Conectando a la Base de Datos...")
    
    sql_table = """
    CREATE TABLE IF NOT EXISTS raw_signals (
        id VARCHAR(50) PRIMARY KEY,
        source VARCHAR(50),
        content_text TEXT,
        original_url TEXT,
        analysis JSONB,
        created_at TIMESTAMP DEFAULT NOW()
    );
    """
    
    sql_insert = """
    INSERT INTO raw_signals (id, source, content_text, original_url, analysis, created_at)
    VALUES 
    ('test-01', 'tiktok', '¡Video viral sobre el producto! Mencionan que es increíble.', 'http://tiktok.com/1', '{"sentimentScore": 0.9}', NOW()),
    ('test-02', 'instagram_reels', 'Un influencer está usando la marca en su tutorial.', 'http://instagram.com/2', '{"sentimentScore": 0.85}', NOW()),
    ('test-03', 'tiktok', 'Cliente quejándose del envío en un video tendencia.', 'http://tiktok.com/3', '{"sentimentScore": -0.5}', NOW());
    """

    async with engine.begin() as conn:
        # 1. Crear tabla si no existe
        await conn.execute(text(sql_table))
        # 2. Insertar datos
        await conn.execute(text(sql_insert))
    
    print("✅ ¡Datos inyectados correctamente!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_data())