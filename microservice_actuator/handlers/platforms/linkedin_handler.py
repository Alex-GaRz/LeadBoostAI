from .base_handler import IPlatformHandler
from microservice_actuator.models.extended_schemas import AudienceSegment, CreativeAsset
# --- AGREGA ESTA LÍNEA ---
from microservice_actuator.models.schemas import ActionRequest

class LinkedInHandler(IPlatformHandler):
    async def build_payload(self, action: ActionRequest, audience: AudienceSegment, creative: CreativeAsset) -> dict:
        return {
            "platform": "LINKEDIN",
            "api_endpoint": "api.linkedin.com/v2/adCampaigns",
            "payload": {
                "name": f"B2B_LeadGen_{action.action_id}",
                "type": "SPONSORED_UPDATES",
                "targetingCriteria": {
                    "include": {
                        "and": [
                            {"urn": "urn:li:adTargetingFacet:industries", "values": audience.industries},
                            {"urn": "urn:li:adTargetingFacet:jobFunctions", "values": audience.job_titles}
                        ]
                    }
                },
                "creative": {
                    "variables": {
                        "data": {
                            "com.linkedin.ads.SponsoredUpdateCreative": {
                                "share": creative.headline, # En LI el headline suele ser el intro
                                "text": creative.body_text,
                                "action": creative.call_to_action
                            }
                        }
                    }
                }
            }
        }