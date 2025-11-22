import time
import schedule
import os
from dotenv import load_dotenv
from core.db_adapter import DBAdapter
from core.reddit_scout import RedditScout
from core.trends_scout import TrendsScout
from core.scout_normalizer import ScoutNormalizer

# Cargar entorno
load_dotenv()

def run_scout_cycle():
    print(f"\n🚀 [SCOUT] Iniciando ciclo de inteligencia: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 1. Inicializar Adaptador DB
    db = DBAdapter()
    normalizer = ScoutNormalizer()
    
    # --- FASE 1: REDDIT INTELLIGENCE ---
    # Configuración (Podría venir de una DB de configuración en el futuro)
    target_subreddits = ["marketing", "smallbusiness", "entrepreneur", "saas"]
    pain_keywords = ["hate", "expensive", "problem with", "alternative to", "sucks", "nightmare"]
    
    reddit_connector = RedditScout()
    raw_pain_points = reddit_connector.hunt_pain_points(target_subreddits, pain_keywords)
    
    count_reddit = 0
    for post in raw_pain_points:
        signal = normalizer.normalize_reddit(post)
        if db.save_signal(signal):
            count_reddit += 1
            
    # --- FASE 2: GOOGLE TRENDS ---
    # Configuración de competidores o términos de interés
    target_keywords = ["AI marketing", "Lead generation", "Automated ads", "CompetitorName"] 
    
    trends_connector = TrendsScout()
    raw_spikes = trends_connector.detect_silent_spikes(target_keywords)
    
    count_trends = 0
    for spike in raw_spikes:
        signal = normalizer.normalize_trends(spike)
        if db.save_signal(signal):
            count_trends += 1

    print(f"🏁 [SCOUT] Ciclo finalizado.")
    print(f"   -> Señales Reddit guardadas: {count_reddit}")
    print(f"   -> Señales Trends guardadas: {count_trends}")

def main():
    print("=========================================")
    print("   LEADBOOST AI - MICROSERVICE SCOUT")
    print("   Advanced Intelligence Ingestion (v1)")
    print("=========================================")

    # Ejecutar inmediatamente al inicio
    run_scout_cycle()

    # Programar ejecución
    interval = int(os.getenv("SCOUT_INTERVAL_MINUTES", 60))
    schedule.every(interval).minutes.do(run_scout_cycle)
    
    print(f"🕒 [SCHEDULER] Ejecutando cada {interval} minutos...")
    
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    main()
