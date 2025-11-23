from core.reddit_scout import RedditScout

def test_connection():
    print("📡 Iniciando prueba de conexión RSS...")
    
    scout = RedditScout()
    
    # Usaremos subreddits muy activos y keywords muy comunes para asegurar que encontremos algo
    # Si buscamos algo muy raro en el RSS (que solo tiene los últimos 25-100 posts), podría salir 0 y pensaríamos que falló.
    test_subs = ["technology", "marketing"]
    test_keywords = ["the", "a", "is", "problem", "new"] # Keywords "basura" solo para verificar flujo de datos
    
    print(f"🔎 Buscando en: {test_subs}")
    results = scout.hunt_pain_points(test_subs, test_keywords, limit=50)
    
    if not results:
        print("❌ No se encontraron resultados. Posibles causas:")
        print("   1. Bloqueo de User-Agent (Reddit rechazó la conexión).")
        print("   2. Error de parsing XML.")
    else:
        print(f"✅ ÉXITO: Se encontraron {len(results)} señales.")
        print("--- Ejemplo de señal capturada ---")
        print(f"Título: {results[0]['title']}")
        print(f"Link: {results[0]['url']}")
        print(f"Subreddit: {results[0]['subreddit']}")
        print("----------------------------------")

if __name__ == "__main__":
    test_connection()