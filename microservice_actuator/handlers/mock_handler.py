"""Mock Platform Handler - For testing without external API calls."""

import asyncio
import logging
from typing import Dict, Any
from core.interfaces import ISocialPlatformAdapter
from core.domain_models import ExecutionResult, ActionPayload, ActionStatus

logger = logging.getLogger(__name__)

class MockHandler(ISocialPlatformAdapter):
    """
    Mock implementation for testing.
    Simulates latency and successful execution without real API calls.
    """
    
    def __init__(self):
        self.authenticated = False
        logger.info("MockHandler initialized")
    
    async def authenticate(self) -> bool:
        """Simulate authentication delay."""
        await asyncio.sleep(0.5)
        self.authenticated = True
        logger.info("MockHandler: Authentication successful")
        return True
    
    async def post_content(self, payload: ActionPayload) -> ExecutionResult:
        """
        Simulate content posting with artificial delay.
        Always succeeds for testing purposes.
        """
        if not self.authenticated:
            await self.authenticate()
        
        logger.info(f"MockHandler: Simulating post for action {payload.action_id}")
        logger.info(f"MockHandler: Content preview: {payload.content_text[:100]}...")
        
        # Simulate network latency
        await asyncio.sleep(1.0)
        
        # Generate fake platform ID
        mock_platform_id = f"MOCK-{payload.action_id[:8]}"
        
        result = ExecutionResult(
            action_id=payload.action_id,
            status=ActionStatus.COMPLETED,
            platform_ref_id=mock_platform_id,
            metadata={
                "platform": "MOCK",
                "simulated": True,
                "content_length": len(payload.content_text),
                "media_count": len(payload.media_urls or [])
            }
        )
        
        logger.info(f"MockHandler: Execution completed - {mock_platform_id}")
        return result
    
    async def get_metrics(self, resource_id: str) -> Dict[str, Any]:
        """Return fake metrics for testing."""
        await asyncio.sleep(0.5)
        
        return {
            "platform_id": resource_id,
            "impressions": 1250,
            "engagements": 87,
            "clicks": 23,
            "shares": 5,
            "simulated": True
        }
