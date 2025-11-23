import feedparser
import requests

class RedditScout:
    def __init__(self):
        print("🕵️ [RedditScout] Inicializando conector RSS...")

    def hunt_pain_points(self, subreddits: list, pain_keywords: list, limit=100) -> list:
        """
        Busca combinaciones de keywords de dolor en subreddits específicos usando RSS.
        """
        results = []
        print(f"🎯 [RedditScout] Cazando puntos de dolor en {len(subreddits)} comunidades...")

        headers = {'User-Agent': 'LeadBoostAI/1.0'}

        for sub in subreddits:
            url = f"https://www.reddit.com/r/{sub}/new.rss?limit={limit}"
            try:
                response = requests.get(url, headers=headers, timeout=10)
                response.raise_for_status()
                feed = feedparser.parse(response.content)
            except Exception as e:
                print(f"❌ [RedditScout] Error al obtener RSS de r/{sub}: {e}")
                continue

            for entry in feed.entries:
                title = entry.get('title', '').lower()
                summary = entry.get('summary', '').lower()
                matched = [k for k in pain_keywords if k.lower() in title or k.lower() in summary]
                if matched:
                    post_data = {
                        "title": entry.get('title', ''),
                        "url": entry.get('link', ''),
                        "published": entry.get('published', ''),
                        "summary": entry.get('summary', ''),
                        "author": entry.get('author', ''),
                        "subreddit": sub,
                        "matched_keywords": matched
                    }
                    results.append(post_data)

        return results
