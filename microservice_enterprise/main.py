import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

# Internal Core Modules
from core.simulator_engine import EnterpriseSimulatorEngine
from core.event_bus import EventBus
from core.safety_engine import safety_engine
from core.distributed_lock import atomic_transaction
from api import routes

# Logging Setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("EnterpriseMain")

# --- LIFECYCLE MANAGEMENT ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Enterprise Nervous System: INITIALIZING...")
    
    # 1. Initialize Event Bus
    bus = EventBus()
    
    # 2. Start Safety Engine (The Listener)
    await safety_engine.start_surveillance()
    
    logger.info("✅ Redis Connected & Safety Rules Active")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Enterprise System...")
    await bus.close()

app = FastAPI(
    title="LeadBoostAI - Block 11: Enterprise Nervous System",
    description="Reactive ERP with Distributed Locking & Kill Switch",
    version="2.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Engine Singleton
engine = EnterpriseSimulatorEngine()

# --- ROUTES ---
app.include_router(routes.router, prefix="/enterprise", tags=["Enterprise ERP"])

# --- EXAMPLE ENDPOINT TO TRIGGER REAL-TIME LOGIC ---
@app.post("/test/simulate-sale")
@atomic_transaction(lambda req, **kwargs: req["sku"])
async def simulate_atomic_sale(req: dict, background_tasks: BackgroundTasks):
    """
    Test endpoint to demonstrate:
    1. Distributed Lock (only one sale per SKU at a time)
    2. Event Publication
    3. Safety Engine Reaction
    """
    sku = req.get("sku")
    qty_sold = req.get("qty", 1)
    
    # 1. Update State (Critical Section protected by lock)
    product = engine.get_product(sku)
    if not product:
        return {"error": "SKU not found"}
    
    if product.qty < qty_sold:
        return {"error": "Insufficient stock"}
        
    product.qty -= qty_sold
    engine._save_state()
    
    # 2. Publish Event (Fire & Forget)
    bus = EventBus()
    background_tasks.add_task(
        bus.publish, 
        "enterprise.inventory_updates", 
        {"sku": sku, "qty": product.qty, "timestamp": "NOW"}
    )
    
    return {
        "status": "Sale Processed", 
        "remaining_stock": product.qty, 
        "lock_status": "Released"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8011, reload=True)