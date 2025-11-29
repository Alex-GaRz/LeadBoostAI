import json
import asyncio
import logging
import redis.asyncio as redis
from typing import Callable, Any, Dict, List
import os

# Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

logger = logging.getLogger("EventBus")

class EventBus:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EventBus, cls).__new__(cls)
            # Inicialización única
            cls._instance.redis = redis.from_url(REDIS_URL, decode_responses=True)
            cls._instance.pubsub = cls._instance.redis.pubsub()
            cls._instance.handlers = {}  # Diccionario para mapear canal -> función
            cls._instance.is_listening = False # Bandera para saber si el bucle maestro corre
        return cls._instance

    async def publish(self, channel: str, message: Dict[str, Any]):
        """
        Emits an event to the ecosystem.
        """
        try:
            payload = json.dumps(message)
            await self.redis.publish(channel, payload)
            logger.debug(f"📡 Event Published [{channel}]: {payload}")
        except Exception as e:
            logger.error(f"🔥 Failed to publish to {channel}: {str(e)}")

    async def subscribe(self, channel: str, handler: Callable):
        """
        Registers a handler for a channel and ensures the Main Loop is running.
        """
        # 1. Registrar el handler en nuestro diccionario local
        if channel not in self.handlers:
            self.handlers[channel] = []
            # Solo nos suscribimos a nivel Redis si es la primera vez para este canal
            await self.pubsub.subscribe(channel)
        
        self.handlers[channel].append(handler)
        logger.info(f"👂 Handler registered for channel: {channel}")

        # 2. Arrancar el Bucle Maestro (Main Loop) si no está corriendo
        if not self.is_listening:
            self.is_listening = True
            asyncio.create_task(self._main_listener_loop())

    async def _main_listener_loop(self):
        """
        SINGLETON LOOP: Escucha TODO el tráfico de PubSub y enruta a los handlers.
        Esto evita el error de 'readuntil() called while another coroutine is waiting'.
        """
        logger.info("🎧 EventBus Main Loop Started")
        try:
            async for message in self.pubsub.listen():
                if message["type"] == "message":
                    channel = message["channel"]
                    data = message["data"]
                    
                    # Buscar handlers para este canal
                    if channel in self.handlers:
                        try:
                            parsed_data = json.loads(data)
                            # Ejecutar todos los handlers registrados para este canal
                            for handler in self.handlers[channel]:
                                asyncio.create_task(handler(parsed_data))
                        except json.JSONDecodeError:
                            logger.error(f"❌ Invalid JSON on {channel}: {data}")
                            
        except Exception as e:
            logger.error(f"💀 Main EventBus Loop died: {str(e)}")
            self.is_listening = False

    async def close(self):
        await self.redis.close()