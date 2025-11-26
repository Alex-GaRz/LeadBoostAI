from .base_handler import IPlatformHandler
from microservice_actuator.models.extended_schemas import AudienceSegment, CreativeAsset
# --- AGREGA ESTA LÍNEA ---
from microservice_actuator.models.schemas import ActionRequest 

class MetaHandler(IPlatformHandler):
    async def build_payload(self, action: ActionRequest, audience: AudienceSegment, creative: CreativeAsset) -> dict:
        # Estructura real de Facebook Marketing API (simplificada)
        return {
            "platform": "META",
            "api_endpoint": "graph.facebook.com/v18.0/act_123/campaigns",
            "payload": {
                "name": f"AI_Gen_Campaign_{action.action_id}",
                "objective": "OUTCOME_SALES",
                "status": "PAUSED", # Siempre pausado por seguridad
                "special_ad_categories": [],
                "adsets": [{
                    "name": "AI_Targeting_Set",
                    "targeting": {
                        "age_min": 18,
                        "age_max": 65,
                        "geo_locations": {"countries": ["MX", "US"]},
                        "interests": [{"id": f"int_{i}", "name": i} for i in audience.interests],
                        "behaviors": [{"id": f"beh_{b}", "name": b} for b in audience.behaviors]
                    },
                    "billing_event": "IMPRESSIONS",
                    "bid_strategy": "LOWEST_COST_WITHOUT_CAP"
                }],
                "creative": {
                    "object_story_spec": {
                        "page_id": "<PAGE_ID>",
                        "link_data": {
                            "message": creative.body_text,
                            "link": "https://leadboost.ai/offer",
                            "picture": creative.image_url,
                            "name": creative.headline,
                            "call_to_action": {"type": creative.call_to_action.upper().replace(" ", "_")}
                        }
                    }
                }
            }
        }