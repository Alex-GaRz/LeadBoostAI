import asyncio
import os
import sys
import logging

# Ajuste de path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
from core.db_adapter import DBAdapter
from core.trends_scout import TrendsScout
from core.reddit_scout import RedditScout
from core.tiktok_scout import TikTokScout # Nueva Importación
from core.scout_normalizer import ScoutNormalizer

load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- CONFIGURACIÓN ---
TARGET_KEYWORDS = ["marketing automation", "ai tools", "saas growth"]
TARGET_SUBREDDITS = ["SaaS", "entrepreneur"]
TARGET_HASHTAGS = ["marketinghacks", "aitools", "smallbusinesstips"]

# Intervalos (segundos)
INTERVAL_REDDIT = 1800   # 30 min
INTERVAL_TRENDS = 14400  # 4 horas
INTERVAL_TIKTOK = 3600   # 1 hora

async def main_loop():
    print("==========================================")
    print("📡 LEADBOOST AI - SCOUT v3.0 (PREDATOR EYES)")
    print("   Modo: Full Spectrum (RSS + Trends + Visual)")
    print("==========================================")

    # 1. Inicialización
    try:
        db = DBAdapter()
        trends_engine = TrendsScout()
        reddit_engine = RedditScout()
        tiktok_engine = TikTokScout() # Nuevo Motor
        normalizer = ScoutNormalizer()
    except Exception as e:
        print(f"❌ Error crítico inicializando componentes: {e}")
        return

    last_run_reddit = 0
    last_run_trends = 0
    last_run_tiktok = 0

    print("✅ Sistema Scout Asíncrono Activo. Escaneando...")

    while True:
        current_time = asyncio.get_running_loop().time()

        # ---------------------------------------------------------
        # A. CICLO REDDIT (Pain Point Hunting) - Sync Wrapped
        # ---------------------------------------------------------
        if current_time - last_run_reddit > INTERVAL_REDDIT:
            print("\n🔵 [Reddit] Iniciando barrido...")
            # Ejecutar código bloqueante (requests/feedparser) en thread pool
            raw_findings = await asyncio.to_thread(reddit_engine.hunt_pain_points, TARGET_SUBREDDITS)
            
            if raw_findings:
                count = 0
                for raw in raw_findings:
                    signal = normalizer.normalize_reddit(raw)
                    if db.save_signal(signal): count += 1
                print(f"   ✅ {count} señales de Reddit guardadas.")
            last_run_reddit = current_time

        # ---------------------------------------------------------
        # B. CICLO TRENDS (Phantom Demand) - Sync Wrapped
        # ---------------------------------------------------------
        if current_time - last_run_trends > INTERVAL_TRENDS:
            print("\n🟢 [Trends] Iniciando análisis...")
            opps = await asyncio.to_thread(trends_engine.detect_phantom_demand, TARGET_KEYWORDS)
            
            if opps:
                count = 0
                for opp in opps:
                    signal = normalizer.normalize_trends(opp)
                    if db.save_signal(signal): count += 1
                print(f"   ✅ {count} oportunidades de Trends guardadas.")
            last_run_trends = current_time

        # ---------------------------------------------------------
        # C. CICLO TIKTOK (Visual Intelligence) - Native Async
        # ---------------------------------------------------------
        if current_time - last_run_tiktok > INTERVAL_TIKTOK:
            print("\n🟣 [TikTok] Iniciando Ojos de Depredador...")
            # Este motor YA es asíncrono
            visual_signals = await tiktok_engine.scan_tag_feed(TARGET_HASHTAGS)
            
            if visual_signals:
                count = 0
                for signal in visual_signals:
                    # La señal ya viene normalizada desde tiktok_scout
                    if db.save_signal(signal): count += 1
                print(f"   ✅ {count} señales visuales guardadas.")
            
            last_run_tiktok = current_time

        # Heartbeat
        await asyncio.sleep(10)

if __name__ == "__main__":
    try:
        asyncio.run(main_loop())
    except KeyboardInterrupt:
        print("\n🛑 DETENIENDO SISTEMA SCOUT...")