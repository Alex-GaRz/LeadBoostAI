from fastapi import WebSocket, WebSocketDisconnect, Query
from firebase_admin import auth
from typing import List, Dict
import json

class ConnectionManager:
    def __init__(self):
        # Mapa de conexiones activas: user_id -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_json(message)

manager = ConnectionManager()

# Dependencia para validar token en WebSocket
async def get_ws_user(
    websocket: WebSocket,
    token: str = Query(...) # El token viene en ?token=XYZ
):
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception:
        # Si falla la auth, cerramos antes de aceptar (o aceptamos y cerramos)
        await websocket.close(code=1008) # Policy Violation
        return None

# Endpoint en main.py (ejemplo)
# @app.websocket("/ws/live-feed")
# async def websocket_endpoint(websocket: WebSocket, user: dict = Depends(get_ws_user)):
#     if not user: return
#     user_id = user['uid']
#     await manager.connect(websocket, user_id)
#     try:
#         while True:
#             # Mantener conexión viva
#             await websocket.receive_text()
#     except WebSocketDisconnect:
#         manager.disconnect(websocket, user_id)