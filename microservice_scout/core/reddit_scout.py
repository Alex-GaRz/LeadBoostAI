import feedparser
from bs4 import BeautifulSoup
import time
from datetime import datetime, timezone

class RedditScout:
    """
    Cazador de 'Pain Points' en Reddit vía RSS.
    Utiliza feedparser para evitar bloqueos de API y BeautifulSoup para limpiar HTML.
    """

    def __init__(self):
        # Palabras clave que denotan dolor, necesidad o queja
        self.PAIN_KEYWORDS = [
            "hate", "problem", "expensive", "slow", "sucks", 
            "alternative to", "help", "worst", "broken", "annoying", 
            "fail", "difficult", "error", "nightmare", "too much",
            "recomiendan", "alternativa", "caro", "lento", "odio", "problema"
        ]
        
        # Headers para simular un navegador y evitar bloqueo de Reddit
        self.HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; LeadBoostAI-Scout/1.0)'}

    def _clean_html(self, raw_html: str) -> str:
        """Elimina tags HTML del contenido RSS para análisis de texto limpio."""
        if not raw_html: 
            return ""
        # lxml es más rápido que html.parser
        return BeautifulSoup(raw_html, "lxml").get_text(separator=" ").strip()

    def hunt_pain_points(self, subreddits_list: list) -> list:
        """
        Recorre subreddits buscando posts recientes con palabras clave de dolor.
        """
        findings = []

        print(f"🕵️ [RedditScout] Escaneando {len(subreddits_list)} subreddits...")

        for sub in subreddits_list:
            # URL RSS pública de Reddit para nuevos posts
            rss_url = f"https://www.reddit.com/r/{sub}/new/.rss"
            
            try:
                # feedparser descarga y parsea el XML automáticamente
                # Usamos el request_headers interno de feedparser si es posible, 
                # o pasamos agent para identificar el bot.
                feed = feedparser.parse(rss_url, agent=self.HEADERS['User-Agent'])

                # Validar estado del feed
                if hasattr(feed, 'status') and feed.status not in [200, 301, 302]:
                    print(f"⚠️ [RedditScout] Error HTTP {feed.status} en r/{sub}")
                    continue
                
                if not feed.entries:
                    print(f"   Info: r/{sub} sin entradas o inaccesible.")
                    continue

                # Analizar los últimos 25 posts (límite estándar del RSS)
                for entry in feed.entries[:25]:
                    
                    title = entry.title
                    # El contenido suele venir en 'summary' o 'content'
                    raw_summary = getattr(entry, 'summary', '') 
                    
                    # Limpieza de HTML
                    content_clean = self._clean_html(raw_summary)
                    
                    # Texto completo para búsqueda
                    full_text = (title + " " + content_clean).lower()

                    # Lógica de Filtrado: ¿Contiene alguna palabra de dolor?
                    matched_keywords = [pk for pk in self.PAIN_KEYWORDS if pk in full_text]

                    if matched_keywords:
                        print(f"🔥 [DOLOR DETECTADO] r/{sub}: '{title[:40]}...' | Keys: {matched_keywords}")
                        
                        findings.append({
                            "title": title,
                            "body": content_clean[:500], # Guardamos snippet para no saturar DB
                            "url": entry.link,
                            "subreddit": sub,
                            "author": getattr(entry, 'author', 'unknown'),
                            "matched_keywords": matched_keywords,
                            # Parseo seguro de fecha
                            "created_utc": time.mktime(entry.published_parsed) if hasattr(entry, 'published_parsed') else time.time()
                        })

            except Exception as e:
                print(f"⚠️ [RedditScout] Excepción procesando r/{sub}: {str(e)}")
            
            # Pausa de cortesía entre subreddits
            time.sleep(2)

        return findings