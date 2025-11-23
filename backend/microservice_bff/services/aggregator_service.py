import os
import logging
import httpx
import asyncio
import time
from firebase_admin import firestore
from typing import Dict, List, Any

# --- CONFIGURACIÓN ---
ANALYST_URL = os.getenv("URL_MICROSERVICE_ANALYST", "http://localhost:8001")
ACTUATOR_URL = os.getenv("URL_MICROSERVICE_ACTUATOR", "http://localhost:8002")

logger = logging.getLogger("uvicorn")

class AggregatorService:
    # Cache Singleton
    _cache: Dict[str, Any] = {}
    _last_updated: float = 0.0
    _CACHE_TTL_SECONDS = 5
    
    def __init__(self):
        self.db = firestore.client()
        logger.info("AggregatorService inicializado. Cache TTL: 5s.")

    async def _fetch_http(self, client, url: str, endpoint: str, fallback: Any) -> Any:
        """Helper HTTP con timeout estricto."""
        try:
            response = await client.get(f"{url}{endpoint}", timeout=1.5)
            if response.status_code == 200:
                return response.json()
            logger.warning(f"HTTP {url} status {response.status_code}. Fallback.")
        except Exception:
            logger.warning(f"Error conexión {url}. Fallback.")
        return fallback

    async def _fetch_market_intelligence(self) -> List[Dict]:
        """
        Consulta a Firestore con TIMEOUT BLINDADO (2.0s).
        """
        try:
            def query_firestore():
                # Operación bloqueante
                signals_ref = self.db.collection('signals')
                query = signals_ref.where(
                    filter=firestore.FieldFilter('source', 'in', ['reddit_rss', 'google_trends'])
                ).order_by(
                    'timestamp', direction=firestore.Query.DESCENDING
                ).limit(5)
                return [doc.to_dict() for doc in query.stream()]

            loop = asyncio.get_event_loop()
            
            # 🔥 AQUÍ ESTÁ LA MAGIA: Forzamos un timeout de 2s a la DB
            # Si Firebase tarda más de 2s, lanzamos error y seguimos.
            signals = await asyncio.wait_for(
                loop.run_in_executor(None, query_firestore), 
                timeout=2.0
            )
            
            # Formateo de datos
            return [
                {
                    "id": s.get("id", "unknown"),
                    "source": s.get("source", "radar").replace("_rss", ""),
                    "topic": s.get("content", "Sin contenido")[:60] + "...",
                    "sentiment": "negative" if s.get("sentiment_score", 0) < -0.2 else "neutral",
                    "timestamp": s.get("timestamp")
                }
                for s in signals
            ]
            
        except asyncio.TimeoutError:
            logger.error("⛔ TIMEOUT CRÍTICO: Firestore tardó más de 2s. Saltando Intelligence.")
            return [] # Fallback vacío instantáneo
        except Exception as e:
            logger.error(f"Error Firestore: {e}")
            return []

    async def _run_full_query(self, client: httpx.AsyncClient) -> Dict:
        """Ejecuta consultas paralelas."""
        
        mock_alerts = [{"id": "MOCK", "type": "SYSTEM_OFFLINE", "severity": "LOW", "message": "Servicios desconectados", "timestamp": "2024-01-01"}]
        mock_campaigns = []

        # Lanzamos las 3 tareas. Gracias al timeout en _fetch_market_intelligence,
        # NINGUNA puede tardar más de 2 segundos.
        tasks = [
            self._fetch_http(client, ANALYST_URL, "/alerts/active", mock_alerts),
            self._fetch_http(client, ACTUATOR_URL, "/campaigns/active", mock_campaigns),
            self._fetch_market_intelligence()
        ]
        
        # asyncio.gather esperará como máximo 2s (el timeout más largo definido)
        alerts_data, execution_data, intelligence_data = await asyncio.gather(*tasks)

        return {
            "health_score": 98, 
            "active_alerts": alerts_data,
            "execution": execution_data,
            "market_intelligence": intelligence_data
        }

    async def get_dashboard_snapshot(self, user_email: str) -> Dict:
        # 1. CACHE HIT
        if (time.time() - self._last_updated) < self._CACHE_TTL_SECONDS:
            logger.info("⚡ Cache Hit (0ms)")
            cached_data = self._cache.copy()
            cached_data['meta']['user'] = user_email
            return cached_data
            
        # 2. CACHE MISS (Ejecutar consulta blindada)
        logger.info("⏳ Actualizando datos...")
        async with httpx.AsyncClient() as client:
            snapshot_data = await self._run_full_query(client)
            
        self._last_updated = time.time()
        
        final_response = {
            "meta": {"user": user_email, "status": "connected", "sources_active": ["Analyst", "Actuator", "Radar_Intelligence"]},
            "radar": {
                "health_score": snapshot_data["health_score"], 
                "active_alerts": snapshot_data["active_alerts"], 
                "market_intelligence": snapshot_data["market_intelligence"]
            },
            "operations": {
                "governance": {"budget_remaining": 4500.00, "approval_status": "AUTOMATIC"}, 
                "execution": snapshot_data["execution"]
            }
        }
        
        self._cache = final_response.copy()
        return final_response