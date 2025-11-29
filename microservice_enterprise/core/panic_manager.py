import logging
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from typing import Dict
from .event_bus import EventBus

logger = logging.getLogger("PanicManager")

class PanicManager:
    def __init__(self):
        self.bus = EventBus()

    @retry(
        stop=stop_after_attempt(5), # MAX_RETRIES_PANIC
        wait=wait_exponential(multiplier=1, min=1, max=10), # 1s, 2s, 4s, 8s...
        retry=retry_if_exception_type(ConnectionError),
        reraise=True
    )
    async def execute_emergency_stop(self, campaign_id: str, reason: str):
        """
        Attempts to pause a campaign via Actuator API.
        Simulates connection instability.
        """
        logger.warning(f"🚨 ATTEMPTING EMERGENCY STOP: Campaign {campaign_id} | Reason: {reason}")
        
        # --- SIMULATION OF EXTERNAL API CALL ---
        # In a real scenario, this calls Meta/Google API
        import random
        if random.random() < 0.3: # 30% chance of API failure
            logger.error("🔥 External Ad API Timeout... Retrying in backoff mode.")
            raise ConnectionError("Ad Platform API Unreachable")
        
        # Success
        logger.info(f"✅ CAMPAIGN {campaign_id} PAUSED SUCCESSFULLY.")
        
        # Notify Dashboard of success
        await self.bus.publish("system.alerts.info", {
            "type": "SAFETY_INTERVENTION",
            "message": f"Campaign {campaign_id} halted due to {reason}",
            "status": "RESOLVED"
        })

    async def trigger_critical_failure(self, context: Dict):
        """
        Called when retries are exhausted. The Nuclear Option.
        """
        logger.critical(f"💀 CRITICAL FAILURE: Could not stop campaign {context.get('campaign_id')}")
        
        # 1. Publish to high priority Panic Channel
        await self.bus.publish("system.alerts.panic", {
            "severity": "CRITICAL",
            "component": "PanicManager",
            "error": "UNABLE_TO_PAUSE_SPEND",
            "context": context
        })
        
        # 2. In a real system: Trigger PagerDuty / SMS / Email
        logger.critical("📱 SMS SENT TO OPS TEAM: MANUAL INTERVENTION REQUIRED IMMEDIATELY")

# Singleton
panic_manager = PanicManager()