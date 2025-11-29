import logging
from .event_bus import EventBus
from .panic_manager import panic_manager

logger = logging.getLogger("SafetyEngine")

class SafetyEngine:
    """
    Real-time Rules Engine.
    Listens to 'enterprise.inventory_updates' and enforces limits.
    """
    
    def __init__(self):
        self.bus = EventBus()

    async def start_surveillance(self):
        logger.info("🛡️ Safety Engine: Surveillance Active")
        await self.bus.subscribe("enterprise.inventory_updates", self._evaluate_inventory_risk)
        await self.bus.subscribe("enterprise.financial_updates", self._evaluate_financial_risk)

    async def _evaluate_inventory_risk(self, event: dict):
        """
        Kill Switch Rule: If SKU stock < 5, kill all associated campaigns.
        """
        sku = event.get("sku")
        qty = event.get("qty", 0)
        
        if qty < 5:
            logger.warning(f"📉 LOW STOCK DETECTED ({qty}) for {sku}. Initiating Kill Switch.")
            
            # Identify campaigns linked to this SKU (Mocked logic)
            # In production, we query the DB mapping SKU -> CampaignID
            mock_campaign_id = f"CAM-AUTO-{sku}"
            
            try:
                await panic_manager.execute_emergency_stop(
                    campaign_id=mock_campaign_id, 
                    reason="INVENTORY_CRITICAL_LEVEL"
                )
            except Exception:
                # If retry logic fails completely
                await panic_manager.trigger_critical_failure({
                    "sku": sku,
                    "qty": qty,
                    "campaign_id": mock_campaign_id
                })

    async def _evaluate_financial_risk(self, event: dict):
        """
        Financial Guardrail: Check Margin or CPA spikes.
        """
        # Logic to check CPA > Threshold, etc.
        pass

# Singleton
safety_engine = SafetyEngine()