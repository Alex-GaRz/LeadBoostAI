from fastapi import APIRouter, Query
from services.analyst_service import AnalystService

router = APIRouter(prefix="/api/analyst", tags=["Analyst"])
service = AnalystService()

@router.get("/search")
async def search(query: str = Query(..., description="Concepto a buscar")):
    # Implementación mock para búsqueda semántica
    return {
        "query": query,
        "result": f"Simulación de búsqueda semántica para: {query}",
        "status": "ok"
    }
