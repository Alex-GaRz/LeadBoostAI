import hashlib
from datetime import datetime, timezone

class ScoutNormalizer:
    """
    Transforma datos crudos de Reddit/Trends al esquema UniversalSignal.
    """

    @staticmethod
    def _generate_id(content: str, source: str) -> str:
        """Genera un ID único basado en el contenido para evitar duplicados."""
        raw = f"{source}-{content}-{datetime.now().strftime('%Y-%m-%d')}"
        return hashlib.md5(raw.encode()).hexdigest()

    @staticmethod
    def normalize_reddit(raw_post: dict) -> dict:
        """
        Mapea un post de Reddit a UniversalSignal.
        """
        content = f"{raw_post['title']} \n {raw_post['body']}"
        
        return {
            "source": "reddit",
            "source_id": raw_post['id'],
            "timestamp": datetime.fromtimestamp(raw_post['created_utc'], tz=timezone.utc).isoformat(),
            "content": content,
            "url": raw_post['url'],
            "type": "pain_point_detection", # Clasificación preliminar
            "scout_metadata": {
                "subreddit": raw_post['subreddit'],
                "score": raw_post['score'],
                "upvote_ratio": raw_post['upvote_ratio'],
                "num_comments": raw_post['num_comments'],
                "pain_keywords_matched": raw_post.get('matched_keywords', [])
            },
            # Campos requeridos por Bloque 2/Firestore
            "analysis": None, # Se llenará en Bloque 2
            "status": "pending_processing"
        }

    @staticmethod
    def normalize_trends(raw_trend: dict) -> dict:
        """
        Mapea una alerta de Google Trends a UniversalSignal.
        """
        return {
            "source": "google_trends",
            "source_id": f"trend-{raw_trend['keyword']}-{datetime.now().timestamp()}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "content": f"Detectado pico de demanda inusual para '{raw_trend['keyword']}'. Volumen actual: {raw_trend['current_volume']} (Promedio: {raw_trend['avg_volume']:.2f}). Incremento: {raw_trend['increase_pct']:.1f}%",
            "url": f"[https://trends.google.com/trends/explore?q=](https://trends.google.com/trends/explore?q=){raw_trend['keyword']}",
            "type": "market_opportunity",
            "scout_metadata": {
                "keyword": raw_trend['keyword'],
                "current_volume": int(raw_trend['current_volume']),
                "avg_30_days": float(raw_trend['avg_volume']),
                "spike_percentage": float(raw_trend['increase_pct'])
            },
            "analysis": None,
            "status": "pending_processing"
        }
