import os
import httpx
import logging
from typing import List, Dict, Any

logger = logging.getLogger("MemoryClient")

class MemoryClient:
    """
    Cliente asíncrono para interactuar con el Microservicio de Memoria (Vector Store).
    Implementa patrón Circuit Breaker simplificado vía Timeouts.
    """
    def __init__(self):
        # Default a localhost:8002 según especificación, configurable vía ENV
        self.base_url = os.getenv("MEMORY_SERVICE_URL", "http://localhost:8002")
        self.timeout = float(os.getenv("RAG_TIMEOUT", "2.0"))
        self.headers = {"Content-Type": "application/json"}

    async def retrieve_creative_context(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """
        Consulta memorias semánticamente similares al concepto actual.
        Retorna lista vacía si falla para garantizar 'Degradación Elegante'.
        """
        endpoint = f"{self.base_url}/memory/search"
        payload = {
            "query": query,
            "limit": limit,
            "category": "creative_strategy" # Filtro hipotético para el backend
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    endpoint, 
                    json=payload, 
                    headers=self.headers, 
                    timeout=self.timeout
                )
                
                if response.status_code == 200:
                    results = response.json()
                    logger.info(f"🧠 [RAG] Recuperados {len(results)} contextos históricos.")
                    return results
                else:
                    logger.warning(f"⚠️ [RAG] Fallo en Memoria (Status {response.status_code}): {response.text}")
                    return []

        except httpx.TimeoutException:
            logger.warning(f"⏱️ [RAG] Timeout ({self.timeout}s) consultando Memoria. Procediendo en modo 'Amnesia'.")
            return []
        except Exception as e:
            logger.error(f"❌ [RAG] Error de conexión con Memoria: {str(e)}")
            return []