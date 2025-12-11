"""
Microservice Visual - Deterministic Visual Engine (DVE)
FastAPI application entry point

This service implements RFC-PHOENIX-04:
Generates pixel-perfect product marketing assets with zero hallucination.
"""

import logging
import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

from api.routes import router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('visual_engine.log')
    ]
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="LeadBoostAI - Visual Engine",
    description="Deterministic Visual Engine for Product Marketing Assets",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware (allow all origins for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api/v1", tags=["visual"])

# Create required directories
REQUIRED_DIRS = ['assets', 'output', 'templates']
for dir_name in REQUIRED_DIRS:
    Path(dir_name).mkdir(exist_ok=True)
    logger.info(f"Ensured directory exists: {dir_name}")


@app.on_event("startup")
async def startup_event():
    """
    Application startup event.
    Initialize resources and validate configuration.
    """
    logger.info("=" * 60)
    logger.info("Starting Deterministic Visual Engine (DVE)")
    logger.info("=" * 60)
    
    # Validate Tesseract installation
    try:
        import pytesseract
        version = pytesseract.get_tesseract_version()
        logger.info(f"✓ Tesseract OCR detected: v{version}")
    except Exception as e:
        logger.warning(f"⚠ Tesseract OCR not available: {e}")
        logger.warning("  Forensic validation will be disabled")
    
    # Validate Playwright
    try:
        from playwright.async_api import async_playwright
        logger.info("✓ Playwright available")
    except Exception as e:
        logger.warning(f"⚠ Playwright not available: {e}")
        logger.warning("  Typography rendering will fail")
    
    # Validate rembg
    try:
        import rembg
        logger.info("✓ rembg (background removal) available")
    except Exception as e:
        logger.error(f"✗ rembg not available: {e}")
        logger.error("  Product segmentation will fail")
    
    logger.info("=" * 60)
    logger.info("Visual Engine ready to process assets")
    logger.info("API Documentation: http://localhost:8000/docs")
    logger.info("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    """
    Application shutdown event.
    Cleanup resources.
    """
    logger.info("Shutting down Visual Engine...")


@app.get("/")
async def root():
    """
    Root endpoint with service information.
    """
    return {
        "service": "LeadBoostAI Visual Engine",
        "version": "1.0.0",
        "status": "operational",
        "documentation": "/docs",
        "health": "/api/v1/health"
    }


if __name__ == "__main__":
    # Run with uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Enable auto-reload for development
        log_level="info"
    )
