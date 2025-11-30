import asyncio
import os
import sys
import logging
import json
import redis

# Ajuste de path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
from core.db_adapter import DBAdapter  # Firebase (Legacy/Hot Data)
from core.postgres_adapter import PostgresAdapter # Postgres (Cold Data)
from core.trends_scout import TrendsScout
from core.reddit_scout import RedditScout
from core.tiktok_scout import TikTokScout
from core.scout_normalizer import ScoutNormalizer

load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- CONFIGURACIÓN ---
TARGET_KEYWORDS = ["marketing automation", "ai tools", "saas growth"]
TARGET_SUBREDDITS = ["SaaS", "entrepreneur"]
TARGET_HASHTAGS = ["marketinghacks", "aitools", "smallbusinesstips"]

INTERVAL_REDDIT = 10   # 30 min
INTERVAL_TRENDS = 14400  # 4 horas
INTERVAL_TIKTOK = 3600   # 1 hora

# Configuración Redis
REDIS_HOST = os.getenv("REDIS_HOST", "localhost") # 'leadboost_bus' en docker
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

async def main_loop():
    print("==========================================")
    print("📡 LEADBOOST AI - SCOUT v3.5 (HYBRID CONNECT)")
    print("   Modo: Firebase (Hot) + Postgres (Cold) + Redis (Events)")
    print("==========================================")

    # 1. Inicialización de Componentes
    try:
        # Base de datos
        firebase_db = DBAdapter()     # Para Dashboard en tiempo real
        postgres_db = PostgresAdapter() # Para Big Data y Re-entrenamiento
        
        # Motores de búsqueda
        trends_engine = TrendsScout()
        reddit_engine = RedditScout()
        tiktok_engine = TikTokScout()
        normalizer = ScoutNormalizer()
        
        # Sistema Nervioso (Redis)
        redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0, decode_responses=True)
        redis_client.ping() # Check conexión
        print(f"✅ Conexión a Redis ({REDIS_HOST}) establecida.")

    except Exception as e:
        print(f"❌ Error crítico inicializando componentes: {e}")
        return

    last_run_reddit = 0
    last_run_trends = 0
    last_run_tiktok = 0

    print("✅ Sistema Scout Asíncrono Activo. Escaneando...")

    while True:
        current_time = asyncio.get_running_loop().time()
        new_data_found = False
        data_sources = []

        # ---------------------------------------------------------
        # A. CICLO REDDIT (Pain Point Hunting)
        # ---------------------------------------------------------
        if current_time - last_run_reddit > INTERVAL_REDDIT:
            print("\n🔵 [Reddit] Iniciando barrido...")
            raw_findings = await asyncio.to_thread(reddit_engine.hunt_pain_points, TARGET_SUBREDDITS)
            
            if raw_findings:
                count = 0
                for raw in raw_findings:
                    signal = normalizer.normalize_reddit(raw)
                    
                    # 1. ALWAYS SAVE TO COLD STORAGE (Postgres)
                    postgres_db.save_raw_signal(signal)
                    
                    # 2. CONDITIONAL SAVE TO HOT STORAGE (Firebase)
                    # Solo guardamos en Firebase si es relevante para mostrar al usuario ya
                    # (Asumimos que todas las de este loop son relevantes por ahora)
                    if firebase_db.save_signal(signal):
                        count += 1
                
                if count > 0:
                    print(f"   ✅ {count} señales procesadas y archivadas.")
                    new_data_found = True
                    data_sources.append("reddit")

            last_run_reddit = current_time

        # ---------------------------------------------------------
        # B. CICLO TRENDS (Phantom Demand)
        # ---------------------------------------------------------
        if current_time - last_run_trends > INTERVAL_TRENDS:
            print("\n🟢 [Trends] Iniciando análisis...")
            opps = await asyncio.to_thread(trends_engine.detect_phantom_demand, TARGET_KEYWORDS)
            
            if opps:
                count = 0
                for opp in opps:
                    signal = normalizer.normalize_trends(opp)
                    postgres_db.save_raw_signal(signal) # Cold
                    if firebase_db.save_signal(signal): count += 1 # Hot
                
                if count > 0:
                    print(f"   ✅ {count} tendencias procesadas.")
                    new_data_found = True
                    data_sources.append("google_trends")

            last_run_trends = current_time

        # ---------------------------------------------------------
        # C. CICLO TIKTOK (Visual Intelligence)
        # ---------------------------------------------------------
        if current_time - last_run_tiktok > INTERVAL_TIKTOK:
            print("\n🟣 [TikTok] Iniciando Ojos de Depredador...")
            visual_signals = await tiktok_engine.scan_tag_feed(TARGET_HASHTAGS)
            
            if visual_signals:
                count = 0
                for signal in visual_signals:
                    postgres_db.save_raw_signal(signal) # Cold
                    if firebase_db.save_signal(signal): count += 1 # Hot
                
                if count > 0:
                    print(f"   ✅ {count} señales visuales procesadas.")
                    new_data_found = True
                    data_sources.append("tiktok")
            
            last_run_tiktok = current_time

        # ---------------------------------------------------------
        # D. NOTIFICACIÓN AL SISTEMA NERVIOSO (Redis)
        # ---------------------------------------------------------
        if new_data_found:
            event_payload = {
                "type": "NEW_DATA",
                "sources": data_sources,
                "timestamp": current_time
            }
            try:
                # Publicar evento para que el Optimizador lo escuche
                redis_client.publish('system_events', json.dumps(event_payload))
                print(f"⚡ [Redis] Evento publicado: {data_sources}")
            except Exception as e:
                print(f"⚠️ Error publicando en Redis: {e}")

        # Heartbeat
        await asyncio.sleep(10)

if __name__ == "__main__":
    try:
        asyncio.run(main_loop())
    except KeyboardInterrupt:
        print("\n🛑 DETENIENDO SISTEMA SCOUT...")