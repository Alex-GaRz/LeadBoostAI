


import asyncio
import json
import logging
import os
import redis.asyncio as redis
from websocket_manager import manager  # Importing the manager provided in context

logger = logging.getLogger("uvicorn")

# Configuration
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")
REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}"
CHANNEL_NAME = "system_events"

async def redis_connector():
    """
    Subscribes to Redis 'system_events' and broadcasts to WebSockets.
    Maintains a persistent connection loop.
    """
    while True:
        try:
            r = redis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
            async with r.pubsub() as pubsub:
                await pubsub.subscribe(CHANNEL_NAME)
                logger.info(f"⚡ BRIDGE ACTIVE: Listening to Redis channel '{CHANNEL_NAME}'")
                
                async for message in pubsub.listen():
                    if message["type"] == "message":
                        data = message["data"]
                        # Broadcast raw data to all connected clients
                        # The frontend will filter what it needs
                        await broadcast_to_clients(data)
                        
        except Exception as e:
            logger.error(f"❌ BRIDGE FAILURE: Redis connection lost. Retrying in 5s... Error: {e}")
            await asyncio.sleep(5)

async def broadcast_to_clients(data: str):
    """Parses Redis msg and sends via WS Manager"""
    try:
        payload = json.loads(data)
        # Using the manager's active connections to broadcast
        # Note: We iterate manually because manager might not have a generic broadcast
        for user_id, connections in manager.active_connections.items():
            for connection in connections:
                await connection.send_json({
                    "type": "SYSTEM_EVENT",
                    "payload": payload
                })
    except json.JSONDecodeError:
        logger.warning("Received non-JSON message from Redis")
    except Exception as e:
        logger.error(f"Broadcast error: {e}")
