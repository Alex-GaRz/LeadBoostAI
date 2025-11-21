from fastapi import APIRouter, HTTPException, Depends
from core.simulator_engine import EnterpriseSimulatorEngine
from models.schemas import ProductState, FinancialState, TransactionRequest, TransactionResult

router = APIRouter()

# Singleton Dependency
engine = EnterpriseSimulatorEngine()
def get_engine():
    return engine

@router.get("/inventory/{sku}", response_model=ProductState)
async def get_inventory(sku: str, sim: EnterpriseSimulatorEngine = Depends(get_engine)):
    product = sim.get_product(sku)
    if not product:
        raise HTTPException(status_code=404, detail="SKU not found in Enterprise ERP")
    return product

@router.get("/financials", response_model=FinancialState)
async def get_financials(sim: EnterpriseSimulatorEngine = Depends(get_engine)):
    return sim.get_financials()

@router.post("/transaction", response_model=TransactionResult)
async def register_transaction(tx: TransactionRequest, sim: EnterpriseSimulatorEngine = Depends(get_engine)):
    """
    Endpoint llamado por el Bloque 7 (Actuador) cuando una campaña genera una conversión real.
    """
    success = sim.process_transaction(tx)
    
    if not success:
        return TransactionResult(
            success=False, 
            message="Transaction failed: Insufficient stock or invalid SKU",
            remaining_stock=0
        )
    
    remaining = sim.get_product(tx.sku).qty
    return TransactionResult(
        success=True,
        message="Transaction recorded in ERP Ledger",
        remaining_stock=remaining
    )

# Endpoint administrativo para el Scenario Trigger
@router.post("/admin/trigger-crisis")
async def trigger_crisis(type: str, sku: str = "PROD-001", sim: EnterpriseSimulatorEngine = Depends(get_engine)):
    if type == "stockout":
        sim.force_stock_update(sku, 0)
        return {"status": "CRISIS TRIGGERED", "detail": f"Stock for {sku} set to 0"}
    elif type == "margin_squeeze":
        sim.force_margin_crash(sku)
        return {"status": "CRISIS TRIGGERED", "detail": f"Margin for {sku} crashed"}
    else:
        raise HTTPException(status_code=400, detail="Unknown crisis type")