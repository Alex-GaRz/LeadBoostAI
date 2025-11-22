import os
import praw
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

class RedditScout:
    def __init__(self):
        print("🕵️ [RedditScout] Inicializando conector PRAW...")
        try:
            self.reddit = praw.Reddit(
                client_id=os.getenv("REDDIT_CLIENT_ID"),
                client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
                user_agent=os.getenv("REDDIT_USER_AGENT")
            )
            # Verificación rápida de credenciales
            print(f"✅ [RedditScout] Conectado como Read-Only: {self.reddit.read_only}")
        except Exception as e:
            print(f"❌ [RedditScout] Error de configuración: {e}")
            self.reddit = None

    def hunt_pain_points(self, subreddits: list, pain_keywords: list, limit=10) -> list:
        """
        Busca combinaciones de keywords de dolor en subreddits específicos.
        Query lógica: "keyword subreddit:nombre"
        """
        if not self.reddit:
            return []

        results = []
        print(f"🏹 [RedditScout] Cazando puntos de dolor en {len(subreddits)} comunidades...")

        for sub in subreddits:
            # Construir query OR para keywords
            # Ej: "(hate OR problem OR expensive) subreddit:marketing"
            keywords_query = " OR ".join(f'"{k}"' for k in pain_keywords)
            query = f"({keywords_query}) subreddit:{sub}"
            
            try:
                # Buscar en 'new' para inmediatez
                for submission in self.reddit.subreddit("all").search(query, sort='new', limit=limit):
                    
                    # Identificar qué keywords hicieron match (básico)
                    text_content = (submission.title + submission.selftext).lower()
                    matched = [k for k in pain_keywords if k in text_content]

                    post_data = {
                        "id": submission.id,
                        "title": submission.title,
                        "body": submission.selftext,
                        "url": submission.url,
                        "score": submission.score,
                        "upvote_ratio": submission.upvote_ratio,
                        "num_comments": submission.num_comments,
                        "created_utc": submission.created_utc,
                        "subreddit": sub,
                        "matched_keywords": matched
                    }
                    results.append(post_data)
                    
            except Exception as e:
                print(f"⚠️ [RedditScout] Error buscando en r/{sub}: {e}")

        print(f"✅ [RedditScout] Se encontraron {len(results)} señales potenciales.")
        return results
