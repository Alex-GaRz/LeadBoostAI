"""
Actuator Microservice - Entry Point
Phase 4 Implementation of RFC-PHOENIX-04
Hexagonal Architecture (Ports & Adapters)
"""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers.execution import router as execution_router
from core.db_repo import LedgerRepository

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("🚀 Starting Actuator Microservice (Phase 4)")
    logger.info("Architecture: Hexagonal (Ports & Adapters)")
    logger.info("DMC Compliance: Invariant #5 - 'Actuator does not think'")
    
    # Initialize database connection pool
    ledger = LedgerRepository()
    await ledger.initialize()
    logger.info("✅ Database connection pool initialized")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Actuator Microservice")
    await ledger.close()
    logger.info("✅ Database connections closed gracefully")


# FastAPI application instance
app = FastAPI(
    title="LeadBoostAI - Actuator Engine",
    description="Phase 4: Execution microservice with Hexagonal Architecture",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware (configure properly for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(execution_router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "service": "actuator",
        "phase": 4,
        "architecture": "hexagonal",
        "status": "operational",
        "documentation": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    
    # PORT 8003 IS MANDATORY FOR ACTUATOR (per RFC-PHOENIX-04)
    port = int(os.getenv("PORT", 8003))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"🌐 Starting server on {host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,  # Disable in production
        log_level="info"
    )
