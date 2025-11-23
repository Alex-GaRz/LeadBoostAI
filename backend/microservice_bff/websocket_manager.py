from fastapi import WebSocket
from typing import List, Dict
import json
import logging

logger = logging.getLogger("uvicorn")

class ConnectionManager:
    def __init__(self):
        # Mapa: user_id -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"WS Conectado: {user_id}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"WS Desconectado: {user_id}")

    async def send_personal_message(self, message: dict, user_id: str):
        """Envía mensaje a un usuario específico"""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    # Si falla, asumimos desconexión y limpiamos luego
                    pass

    async def broadcast_intelligence_alert(self, signal: dict):
        """
        NUEVO: Transmite señales de alta prioridad a TODOS los usuarios conectados.
        Útil para 'Breaking News' de Google Trends.
        """
        payload = {
            "type": "INTELLIGENCE_ALERT",
            "payload": {
                "source": signal.get("source", "radar"),
                "topic": signal.get("content", "Alert"),
                "severity": "HIGH" if signal.get("source") == "google_trends" else "MEDIUM"
            }
        }
        
        # Broadcast a todos los usuarios activos (Administradores)
        for user_id, connections in self.active_connections.items():
            for connection in connections:
                try:
                    await connection.send_json(payload)
                except Exception:
                    pass

manager = ConnectionManager()