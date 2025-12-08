import os
import json
import asyncio
import logging
import redis.asyncio as redis
from datetime import datetime

# Configuración de Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EventBus:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EventBus, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        # CAMBIO CRITICO: Default a 'redis_bus' para Docker, no localhost
        self.redis_host = os.getenv("REDIS_HOST", "redis_bus")
        self.redis_port = int(os.getenv("REDIS_PORT", 6379))
        self.redis_db = int(os.getenv("REDIS_DB", 0))
        
        logger.info(f"🔌 EventBus inicializando conexión a: {self.redis_host}:{self.redis_port}")
        
        self.pubsub = None
        self.connection = None
        self._initialized = True
    
    async def connect(self):
        try:
            # Crear pool de conexiones explícito
            self.connection = redis.Redis(
                host=self.redis_host,
                port=self.redis_port,
                db=self.redis_db,
                decode_responses=True,
                socket_connect_timeout=5,
                retry_on_timeout=True
            )
            await self.connection.ping()
            self.pubsub = self.connection.pubsub()
            logger.info(f"✅ EventBus Conectado exitosamente a Redis en {self.redis_host}")
        except Exception as e:
            logger.error(f"❌ FALLO CRITICO conectando a Redis ({self.redis_host}): {str(e)}")
            # No matamos el proceso aquí, dejamos que el retry del main loop lo maneje o falle
            raise e
    
    async def publish(self, channel: str, message: dict):
        if not self.connection:
            await self.connect()
        await self.connection.publish(channel, json.dumps(message))
    
    async def subscribe(self, channel: str, handler):
        if not self.connection:
            await self.connect()
        
        await self.pubsub.subscribe(channel)
        logger.info(f"🎧 Suscrito al canal: {channel}")
        
        # Loop de escucha en background
        asyncio.create_task(self._listener(handler))
    
    async def _listener(self, handler):
        try:
            async for message in self.pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    await handler(data)
        except Exception as e:
            logger.error(f"⚠️ Error en listener de Redis: {e}")
