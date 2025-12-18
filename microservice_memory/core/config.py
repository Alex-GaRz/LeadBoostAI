"""
Configuration Management - FASE 6.1
Manejo centralizado de configuración del Memory Service.
"""

from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache
import os


class Settings(BaseSettings):
    """
    Configuración del Memory Service.
    Valores leídos desde variables de entorno o valores por defecto.
    """
    # Service Identity
    SERVICE_NAME: str = "microservice_memory"
    SERVICE_VERSION: str = "6.1.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8006
    
    # ChromaDB Configuration
    CHROMA_PERSIST_DIRECTORY: str = "./chroma_db"
    CHROMA_COLLECTION_NAME: str = "campaign_memories"
    
    # Embedding Configuration
    OPENAI_API_KEY: Optional[str] = None
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSION: int = 1536
    
    # Fallback to local embeddings if OpenAI not available
    USE_LOCAL_EMBEDDINGS: bool = False
    LOCAL_EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    
    # Retrieval Configuration
    DEFAULT_RETRIEVAL_LIMIT: int = 3
    MAX_RETRIEVAL_LIMIT: int = 10
    
    # Security & Isolation
    ENFORCE_TENANT_ISOLATION: bool = True
    
    # Environment (development, staging, production)
    ENVIRONMENT: str = "development"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """
    Singleton para acceder a la configuración.
    Cached para evitar re-leer variables de entorno.
    """
    return Settings()


# Configuración de logging
def configure_logging():
    """Configura el sistema de logging del servicio."""
    import logging
    
    settings = get_settings()
    
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Silenciar logs verbosos de bibliotecas externas
    logging.getLogger("chromadb").setLevel(logging.WARNING)
    logging.getLogger("openai").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    
    return logging.getLogger(settings.SERVICE_NAME)
