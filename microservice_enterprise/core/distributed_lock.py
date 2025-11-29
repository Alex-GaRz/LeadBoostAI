import redis.asyncio as redis
import asyncio
import uuid
import time
import logging
from functools import wraps
import os
from typing import Callable, Any

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
LOCK_TIMEOUT = 5  # seconds

logger = logging.getLogger("DistributedLock")

class DistributedRedisLock:
    def __init__(self, resource_id: str, timeout: int = LOCK_TIMEOUT):
        self.redis = redis.from_url(REDIS_URL, decode_responses=True)
        self.resource_id = f"lock:{resource_id}"
        self.timeout = timeout
        self.identifier = str(uuid.uuid4())

    async def __aenter__(self):
        if await self.acquire():
            return self
        raise RuntimeError(f"Could not acquire lock for {self.resource_id}")

    async def __aexit__(self, exc_type, exc, tb):
        await self.release()
        await self.redis.close()

    async def acquire(self) -> bool:
        """
        Try to acquire the lock using SET resource_id unique_id NX PX timeout
        """
        start_time = time.time()
        # Spin lock with simple retry mechanism (could be exponential backoff too)
        while time.time() - start_time < self.timeout:
            if await self.redis.set(self.resource_id, self.identifier, ex=self.timeout, nx=True):
                logger.debug(f"🔒 Lock acquired: {self.resource_id}")
                return True
            await asyncio.sleep(0.1)
        
        logger.warning(f"⏳ Timeout acquiring lock: {self.resource_id}")
        return False

    async def release(self):
        """
        Release lock using Lua script to ensure we only delete OUR lock
        """
        lua_script = """
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
        """
        script = self.redis.register_script(lua_script)
        result = await script(keys=[self.resource_id], args=[self.identifier])
        if result:
            logger.debug(f"🔓 Lock released: {self.resource_id}")
        else:
            logger.warning(f"⚠️ Failed to release lock (expired or owned by other): {self.resource_id}")

def atomic_transaction(resource_key_builder: Callable):
    """
    Decorator for atomic operations.
    resource_key_builder: function that extracts the ID from args/kwargs
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            resource_id = resource_key_builder(*args, **kwargs)
            async with DistributedRedisLock(resource_id):
                return await func(*args, **kwargs)
        return wrapper
    return decorator