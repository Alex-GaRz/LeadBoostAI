import os
import asyncpg
from typing import Optional, Dict, Any
import json
import logging

logger = logging.getLogger(__name__)

class LedgerRepository:
    def __init__(self):
        self.db_host = os.getenv("DB_HOST", "localhost")
        self.db_port = int(os.getenv("DB_PORT", 5432))
        self.db_name = os.getenv("DB_NAME", "leadboost_db")
        self.db_user = os.getenv("DB_USER", "leadboost")
        self.db_password = os.getenv("DB_PASSWORD")
        if not self.db_password:
            raise ValueError("DB_PASSWORD environment variable is required")
        self.pool: Optional[asyncpg.Pool] = None

    async def initialize(self):
        self.pool = await asyncpg.create_pool(
            host=self.db_host,
            port=self.db_port,
            user=self.db_user,
            password=self.db_password,
            database=self.db_name,
            min_size=1,
            max_size=5,
        )
        logger.info("Database connection pool initialized successfully")

    async def close(self):
        if self.pool:
            await self.pool.close()

    async def acquire_execution_lock(self, action_id: str, tenant_id: str = None) -> bool:
        """
        Atomically set status to 'EXECUTING' if current status is 'APPROVED'.
        Returns True if lock acquired, False otherwise.
        """
        if not self.pool:
            raise RuntimeError("Database pool not initialized")
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                UPDATE actions_ledger
                SET status = 'EXECUTING', updated_at = NOW()
                WHERE id = $1 AND status = 'APPROVED'
                RETURNING id
                """,
                action_id
            )
            return row is not None

    async def update_status(self, action_id: str, status: str, result: Optional[Dict[str, Any]] = None) -> bool:
        """
        Update the status and optionally store the result as JSON.
        Returns True if any row was updated.
        """
        if not self.pool:
            raise RuntimeError("Database pool not initialized")
        async with self.pool.acquire() as conn:
            row = await conn.execute(
                """
                UPDATE actions_ledger
                SET status = $2,
                    result = COALESCE($3, result),
                    updated_at = NOW()
                WHERE id = $1
                """,
                action_id,
                status,
                json.dumps(result) if result else None
            )
            # asyncpg's execute returns a string like 'UPDATE 1'
            return row.startswith("UPDATE 1")
