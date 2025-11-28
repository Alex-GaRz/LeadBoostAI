# microservice_analyst/core/resonance_math.py

import numpy as np
from collections import Counter
from datetime import datetime
from typing import List
from microservice_analyst.models.schemas import AgentReaction, ResonanceReport

class ResonanceAnalyzer:
    @staticmethod
    def analyze_results(sim_id: str, results: List[AgentReaction]) -> ResonanceReport:
        if not results:
            return None

        # 1. Quantitative Metrics
        probs = [r.click_probability for r in results]
        viral_score = np.mean(probs) * 100 # Simple mean for now
        conversion_prob = (sum([1 for r in results if r.purchase_intent]) / len(results)) * 100

        # 2. Qualitative Aggregation
        emotions = Counter([r.emotional_response for r in results])
        objections = [r.primary_objection for r in results if r.primary_objection]
        top_objections = [obj for obj, count in Counter(objections).most_common(3)]

        # 3. Recommendation Logic
        recs = []
        if viral_score < 40:
            recs.append("Ad lacks immediate hook. Viral score is critical.")
        if "Price" in str(top_objections) or "Cost" in str(top_objections):
            recs.append("High price sensitivity detected. Emphasize value or financing.")
        if conversion_prob < 10 and viral_score > 60:
            recs.append("High clickbait factor but low trust. Improve offer clarity.")

        return ResonanceReport(
            simulation_id=sim_id,
            timestamp=datetime.now(),
            viral_score=round(viral_score, 2),
            conversion_probability=round(conversion_prob, 2),
            dominant_emotions=dict(emotions),
            top_objections=top_objections,
            demographic_breakdown={"sample_size": len(results)},
            recommendations=recs
        )