from .base_handler import IPlatformHandler
from microservice_actuator.models.extended_schemas import AudienceSegment, CreativeAsset
# --- AGREGA ESTA LÍNEA ---
from microservice_actuator.models.schemas import ActionRequest

class GoogleHandler(IPlatformHandler):
    async def build_payload(self, action: ActionRequest, audience: AudienceSegment, creative: CreativeAsset) -> dict:
        # Estructura para Responsive Search Ads (RSA)
        return {
            "platform": "GOOGLE",
            "api_endpoint": "googleads.googleapis.com/v14/customers/123/campaigns",
            "payload": {
                "campaign": {
                    "name": f"Search_AI_{action.action_id}",
                    "advertising_channel_type": "SEARCH",
                    "status": "PAUSED"
                },
                "ad_group": {
                    "name": "Dynamic_Keywords_Group",
                    "cpc_bid_micros": 1000000 # $1.00
                },
                "ad_group_criterion": [
                    {"keyword": {"text": kw, "match_type": "BROAD"}} for kw in audience.positive_keywords
                ] + [
                    {"keyword": {"text": kw, "match_type": "EXACT"}, "negative": True} for kw in audience.negative_keywords
                ],
                "ad_group_ad": {
                    "ad": {
                        "responsive_search_ad": {
                            "headlines": [
                                {"text": creative.headline},
                                {"text": "Solución Verificada"}, # Rellenos necesarios para RSA
                                {"text": "Oferta Limitada"}
                            ],
                            "descriptions": [
                                {"text": creative.body_text},
                                {"text": f"Click para {creative.call_to_action}"}
                            ],
                            "path1": "services",
                            "path2": "promo"
                        }
                    }
                }
            }
        }