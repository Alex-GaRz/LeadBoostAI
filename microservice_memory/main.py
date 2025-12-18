"""
Memory Service - FASE 6.1
Servicio de memoria corporativa con RAG (Retrieval-Augmented Generation).

Este microservicio implementa el almacenamiento y recuperación de experiencias
basado en Triadas Contexto-Acción-Resultado usando ChromaDB y embeddings.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

from api.routes import router
from core.config import get_settings, configure_logging

# Configurar logging
logger = configure_logging()

# Crear aplicación FastAPI
settings = get_settings()

app = FastAPI(
    title="Memory Service - LeadBoostAI",
    description="Servicio de memoria corporativa con búsqueda vectorial semántica",
    version=settings.SERVICE_VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar rutas
app.include_router(router, prefix="/api/v1/memory", tags=["Memory"])


@app.on_event("startup")
async def startup_event():
    """Ejecuta tareas de inicialización al arrancar el servicio."""
    logger.info("=" * 60)
    logger.info(f"Starting {settings.SERVICE_NAME} v{settings.SERVICE_VERSION}")
    logger.info("=" * 60)
    logger.info(f"Host: {settings.HOST}:{settings.PORT}")
    logger.info(f"ChromaDB Path: {settings.CHROMA_PERSIST_DIRECTORY}")
    logger.info(f"Collection: {settings.CHROMA_COLLECTION_NAME}")
    logger.info(f"Embedding Model: {settings.EMBEDDING_MODEL}")
    logger.info(f"OpenAI Configured: {bool(settings.OPENAI_API_KEY)}")
    logger.info("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    """Ejecuta tareas de limpieza al detener el servicio."""
    logger.info("Shutting down Memory Service...")
    logger.info("Service stopped successfully")


@app.get("/")
async def root():
    """Endpoint raíz con información del servicio."""
    return {
        "service": settings.SERVICE_NAME,
        "version": settings.SERVICE_VERSION,
        "status": "running",
        "description": "Corporate Memory Service with RAG capabilities",
        "docs": "/docs",
        "health": "/api/v1/memory/health"
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,  # Solo para desarrollo
        log_level=settings.LOG_LEVEL.lower()
    )
