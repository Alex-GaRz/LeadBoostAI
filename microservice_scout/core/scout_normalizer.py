import hashlib
from datetime import datetime, timezone

class ScoutNormalizer:
    """
    Normaliza datos de Trends y Reddit al esquema UniversalSignal (Bloque 1/2).
    Asegura consistencia antes de guardar en Firestore.
    """

    @staticmethod
    def _generate_id(source_id: str, source_type: str) -> str:
        """Genera un ID hash determinístico para evitar duplicados en DB."""
        raw = f"{source_type}-{source_id}-{datetime.now().strftime('%Y-%m')}"
        return hashlib.md5(raw.encode()).hexdigest()

    @staticmethod
    def normalize_reddit(raw_post: dict) -> dict:
        """
        Convierte hallazgo de Reddit -> UniversalSignal
        """
        # Formato de contenido legible para el analista (Bloque 4/5)
        content_text = f"[REDDIT PAIN] Title: {raw_post['title']}\nContext: {raw_post['body']}..."
        
        # Timestamp ISO 8601 UTC
        ts_val = raw_post.get('created_utc')
        if isinstance(ts_val, (int, float)):
            timestamp = datetime.fromtimestamp(ts_val, tz=timezone.utc).isoformat()
        else:
            timestamp = datetime.now(timezone.utc).isoformat()
            
        # ID único basado en URL para no guardar el mismo post dos veces
        unique_id = ScoutNormalizer._generate_id(raw_post['url'], "reddit")

        return {
            "id": unique_id,            # ID del documento
            "source": "reddit_rss",     # Origen
            "source_id": raw_post.get('url', ''), 
            "timestamp": timestamp,
            "content": content_text,
            "url": raw_post.get('url', ''),
            "type": "pain_point",       # Clasificación para el sistema
            "scout_metadata": {
                "subreddit": raw_post.get('subreddit', ''),
                "pain_keywords": raw_post.get('matched_keywords', []),
                "author": raw_post.get('author', '')
            },
            "status": "pending_processing",
            "analysis": None            # Se llenará en Bloques posteriores
        }

    @staticmethod
    def normalize_trends(raw_trend: dict) -> dict:
        """
        Convierte oportunidad de Trends -> UniversalSignal
        """
        content_text = (
            f"[MARKET SPIKE] Keyword: '{raw_trend['keyword']}'. "
            f"Demand Spike: +{raw_trend['increase_pct']}% (Last 3 days). "
            f"Current Vol: {raw_trend['current_volume']} vs Avg: {raw_trend['avg_volume']}."
        )
        
        unique_id = ScoutNormalizer._generate_id(raw_trend['keyword'], "trends")

        return {
            "id": unique_id,
            "source": "google_trends",
            "source_id": f"trend-{raw_trend['keyword']}",
            "timestamp": raw_trend.get('timestamp', datetime.now(timezone.utc).isoformat()),
            "content": content_text,
            "url": f"https://trends.google.com/trends/explore?q={raw_trend['keyword']}",
            "type": "opportunity",
            "scout_metadata": {
                "keyword": raw_trend['keyword'],
                "spike_pct": raw_trend['increase_pct'],
                "volume_curr": raw_trend['current_volume'],
                "volume_avg": raw_trend['avg_volume']
            },
            "status": "pending_processing",
            "analysis": None
        }