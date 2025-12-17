"""
Configuration for the Core Orchestrator.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings."""
    
    # Application
    app_name: str = "Core Orchestrator"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Service URLs
    service_radar_url: str = "http://localhost:8001"
    service_analyst_url: str = "http://localhost:8002"
    service_visual_url: str = "http://localhost:8003"
    service_optimizer_url: str = "http://localhost:8004"
    
    # Idempotency & Storage
    redis_url: Optional[str] = None  # "redis://localhost:6379/0"
    use_in_memory_store: bool = True  # Fallback if Redis not available
    
    # Retry Configuration
    default_max_retries: int = 3
    retry_backoff_base: float = 2.0  # Exponential backoff base (seconds)
    
    # Timeouts
    service_timeout: float = 30.0  # HTTP timeout in seconds
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
