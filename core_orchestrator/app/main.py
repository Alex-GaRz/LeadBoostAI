"""
Core Orchestrator FastAPI application.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import routes
import os

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Enterprise orchestrator for LeadBoostAI campaign workflows",
)

# CORS middleware - SECURITY PATCH: Restricted origins
# Read from environment variable or use secure defaults
allowed_origins = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://internal-dashboard"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(routes.router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "status": "healthy"
    }


@app.get("/health")
async def health():
    """Detailed health check."""
    return {
        "service": settings.app_name,
        "status": "healthy",
        "configuration": {
            "radar_url": settings.service_radar_url,
            "analyst_url": settings.service_analyst_url,
            "visual_url": settings.service_visual_url,
            "optimizer_url": settings.service_optimizer_url,
        }
    }
