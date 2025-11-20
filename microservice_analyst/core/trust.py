class TrustScorer:
    @staticmethod
    def calculate(source: str, ai_confidence: float) -> float:
        reliability = {
            'internal_db': 1.0, 'news_api': 0.9, 'twitter': 0.5
        }.get(source.lower(), 0.6)
        return round((reliability * 0.4) + (ai_confidence * 0.6), 2)