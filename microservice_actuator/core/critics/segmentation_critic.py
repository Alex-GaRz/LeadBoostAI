import logging
from microservice_actuator.models.extended_schemas import AudienceSegment

logger = logging.getLogger("SegmentationCritic")

class SegmentationAuditor:
    """
    Deterministic rule-based + Heuristic auditor. 
    Does not necessarily need LLM to save latency, but checks for logical consistency.
    """
    
    def validate_segment(self, segment: AudienceSegment) -> AudienceSegment:
        logger.info("👥 Validating Audience Segment configuration...")
        
        # 1. Hallucination Check: Standard Ad Platforms don't support arbitrary text as interests effectively
        # We check for obviously fake or overly specific "GPT-isms"
        cleaned_interests = []
        rejected_interests = []
        
        for interest in segment.interests:
            # Rule: Interests are usually nouns, not sentences
            if len(interest.split()) > 4: 
                rejected_interests.append(interest)
            # Rule: Filter out "Dragon Owners" type absurdities (Mock logic)
            elif "owner of" in interest.lower() and "business" not in interest.lower():
                rejected_interests.append(interest)
            else:
                cleaned_interests.append(interest)
                
        if rejected_interests:
            logger.warning(f"⚠️ Removed hallucinatory interests: {rejected_interests}")
            segment.interests = cleaned_interests

        # 2. Taxonomy Fallback
        if not segment.interests and not segment.behaviors:
            logger.error("❌ Segment stripped to empty. Injecting broad fallback.")
            segment.interests = ["General Interest", "News", "Technology"]
            segment.rationale += " [AUDIT: Original segment was invalid, applied fallback]"

        return segment
