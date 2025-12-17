"""
Idempotency store for preventing duplicate processing.
Supports both Redis (production) and in-memory (development) backends.
"""

import logging
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class IdempotencyStore:
    """
    Store for tracking execution IDs to ensure idempotency.
    
    Key format: "campaign:{campaign_id}:exec:{execution_id}:step:{state}"
    """
    
    def __init__(self, redis_url: Optional[str] = None, use_in_memory: bool = True):
        """
        Initialize the idempotency store.
        
        Args:
            redis_url: Redis connection URL (if available)
            use_in_memory: Use in-memory store as fallback
        """
        self.redis_client = None
        self.in_memory_store: Dict[str, Any] = {}
        
        if redis_url and not use_in_memory:
            try:
                import redis
                self.redis_client = redis.from_url(redis_url, decode_responses=True)
                logger.info("IdempotencyStore using Redis backend")
            except ImportError:
                logger.warning("redis package not installed, falling back to in-memory store")
                use_in_memory = True
            except Exception as e:
                logger.warning(f"Failed to connect to Redis: {e}, falling back to in-memory store")
                use_in_memory = True
        
        if use_in_memory:
            logger.info("IdempotencyStore using in-memory backend")
    
    def _make_key(self, campaign_id: UUID, execution_id: UUID, state: str) -> str:
        """Generate a key for the idempotency store."""
        return f"campaign:{campaign_id}:exec:{execution_id}:step:{state}"
    
    async def exists(self, campaign_id: UUID, execution_id: UUID, state: str) -> bool:
        """
        Check if an execution step has already been processed.
        
        Args:
            campaign_id: Campaign UUID
            execution_id: Execution UUID
            state: Current state/step
            
        Returns:
            True if already processed, False otherwise
        """
        key = self._make_key(campaign_id, execution_id, state)
        
        if self.redis_client:
            return bool(self.redis_client.exists(key))
        else:
            return key in self.in_memory_store
    
    async def set(
        self,
        campaign_id: UUID,
        execution_id: UUID,
        state: str,
        status: str = "DONE",
        ttl: int = 86400  # 24 hours
    ):
        """
        Mark an execution step as processed.
        
        Args:
            campaign_id: Campaign UUID
            execution_id: Execution UUID
            state: Current state/step
            status: Status value (default: "DONE")
            ttl: Time to live in seconds (default: 24 hours)
        """
        key = self._make_key(campaign_id, execution_id, state)
        value = {
            "status": status,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        if self.redis_client:
            self.redis_client.setex(key, ttl, str(value))
        else:
            self.in_memory_store[key] = value
        
        logger.debug(f"Marked execution step as processed: {key}")
    
    async def delete(self, campaign_id: UUID, execution_id: UUID, state: str):
        """
        Remove an execution step from the store (for cleanup or retry).
        
        Args:
            campaign_id: Campaign UUID
            execution_id: Execution UUID
            state: Current state/step
        """
        key = self._make_key(campaign_id, execution_id, state)
        
        if self.redis_client:
            self.redis_client.delete(key)
        else:
            self.in_memory_store.pop(key, None)
        
        logger.debug(f"Removed execution step from store: {key}")
    
    async def clear_campaign(self, campaign_id: UUID):
        """
        Clear all execution records for a campaign (for cleanup).
        
        Args:
            campaign_id: Campaign UUID
        """
        pattern = f"campaign:{campaign_id}:*"
        
        if self.redis_client:
            keys = self.redis_client.keys(pattern)
            if keys:
                self.redis_client.delete(*keys)
        else:
            keys_to_delete = [k for k in self.in_memory_store.keys() if k.startswith(f"campaign:{campaign_id}:")]
            for key in keys_to_delete:
                del self.in_memory_store[key]
        
        logger.info(f"Cleared all execution records for campaign {campaign_id}")
    
    # ============================================================
    # DISTRIBUTED LOCK METHODS (Security Patch)
    # ============================================================
    
    def _make_lock_key(self, campaign_id: UUID, execution_id: UUID) -> str:
        """Generate a lock key for workflow execution."""
        return f"lock:workflow:{campaign_id}:{execution_id}"
    
    def _make_workflow_key(self, campaign_id: UUID, execution_id: UUID) -> str:
        """Generate a key for workflow completion tracking."""
        return f"workflow:completed:{campaign_id}:{execution_id}"
    
    async def acquire_lock(self, campaign_id: UUID, execution_id: UUID, ttl: int = 300) -> bool:
        """
        Acquire a distributed lock for workflow execution.
        
        Args:
            campaign_id: Campaign UUID
            execution_id: Execution UUID
            ttl: Lock timeout in seconds (default: 5 minutes)
            
        Returns:
            True if lock acquired, False if already locked
        """
        key = self._make_lock_key(campaign_id, execution_id)
        
        if self.redis_client:
            # Use Redis SETNX (SET if Not eXists) for atomic lock
            result = self.redis_client.set(key, "LOCKED", nx=True, ex=ttl)
            acquired = bool(result)
        else:
            # In-memory fallback
            if key in self.in_memory_store:
                acquired = False
            else:
                self.in_memory_store[key] = "LOCKED"
                acquired = True
        
        if acquired:
            logger.info(f"Acquired lock for workflow: {campaign_id}:{execution_id}")
        else:
            logger.warning(f"Failed to acquire lock (already locked): {campaign_id}:{execution_id}")
        
        return acquired
    
    async def release_lock(self, campaign_id: UUID, execution_id: UUID):
        """
        Release a distributed lock.
        
        Args:
            campaign_id: Campaign UUID
            execution_id: Execution UUID
        """
        key = self._make_lock_key(campaign_id, execution_id)
        
        if self.redis_client:
            self.redis_client.delete(key)
        else:
            self.in_memory_store.pop(key, None)
        
        logger.info(f"Released lock for workflow: {campaign_id}:{execution_id}")
    
    async def is_workflow_processed(self, campaign_id: UUID, execution_id: UUID) -> bool:
        """
        Check if a workflow has already been completed.
        
        Args:
            campaign_id: Campaign UUID
            execution_id: Execution UUID
            
        Returns:
            True if workflow already processed
        """
        key = self._make_workflow_key(campaign_id, execution_id)
        
        if self.redis_client:
            return bool(self.redis_client.exists(key))
        else:
            return key in self.in_memory_store
    
    async def mark_workflow_processed(
        self,
        campaign_id: UUID,
        execution_id: UUID,
        payload_data: Dict[str, Any],
        ttl: int = 86400
    ):
        """
        Mark a workflow as completed and cache the result.
        
        Args:
            campaign_id: Campaign UUID
            execution_id: Execution UUID
            payload_data: Serialized payload data to cache
            ttl: Cache TTL in seconds (default: 24 hours)
        """
        key = self._make_workflow_key(campaign_id, execution_id)
        
        if self.redis_client:
            self.redis_client.setex(key, ttl, str(payload_data))
        else:
            self.in_memory_store[key] = payload_data
        
        logger.info(f"Marked workflow as processed: {campaign_id}:{execution_id}")
    
    async def get_cached_payload(self, campaign_id: UUID, execution_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached payload for a completed workflow.
        
        Args:
            campaign_id: Campaign UUID
            execution_id: Execution UUID
            
        Returns:
            Cached payload data or None
        """
        key = self._make_workflow_key(campaign_id, execution_id)
        
        if self.redis_client:
            value = self.redis_client.get(key)
            if value:
                # Note: In production, use proper JSON serialization
                return eval(value) if value else None
        else:
            return self.in_memory_store.get(key)
        
        return None
