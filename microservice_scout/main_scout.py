import time
import os
import sys

# Ajuste de path para importar módulos locales si es necesario
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
from core.db_adapter import DBAdapter
from core.trends_scout import TrendsScout
from core.reddit_scout import RedditScout
from core.scout_normalizer import ScoutNormalizer

# Cargar variables de entorno
load_dotenv()

# --- CONFIGURACIÓN DE OBJETIVOS (Se pueden mover a un JSON externo) ---
TARGET_KEYWORDS = [
    "crm software", "marketing automation", "chatbot ai", 
    "lead generation", "salesforce pricing", "hubspot alternative",
    "email marketing tools", "seo services", "business intelligence"
]

TARGET_SUBREDDITS = [
    "marketing", "sales", "smallbusiness", "entrepreneur", 
    "startups", "SaaS", "digitalmarketing", "growthhacking"
]

# --- INTERVALOS DE EJECUCIÓN (Segundos) ---
# Reddit: Cada 30 min (Los feeds RSS cambian rápido)
INTERVAL_REDDIT = 1800   
# Trends: Cada 4 horas (Google Trends no cambia tan rápido y tiene rate limits estrictos)
INTERVAL_TRENDS = 14400  

def main():
    print("==========================================")
    print("📡 LEADBOOST AI - MICROSERVICE SCOUT v2.0")
    print("   Modo: Tactical Radar (RSS + Trends)")
    print("==========================================")

    # 1. Inicialización de Componentes
    try:
        db = DBAdapter()
        trends_engine = TrendsScout()
        reddit_engine = RedditScout()
        normalizer = ScoutNormalizer()
    except Exception as e:
        print(f"❌ Error crítico inicializando componentes: {e}")
        return

    # Inicializar timers en 0 para ejecución inmediata al arranque
    # O usar time.time() para esperar el primer intervalo
    last_run_reddit = 0
    last_run_trends = 0

    print("✅ Sistema Scout Activo. Esperando ciclos de ejecución...")

    while True:
        current_time = time.time()

        # ---------------------------------------------------------
        # A. CICLO REDDIT (Pain Point Hunting)
        # ---------------------------------------------------------
        if current_time - last_run_reddit > INTERVAL_REDDIT:
            print(f"\n[{time.strftime('%H:%M:%S')}] 🔵 Iniciando ciclo Reddit RSS...")
            try:
                raw_findings = reddit_engine.hunt_pain_points(TARGET_SUBREDDITS)
                
                if raw_findings:
                    print(f"   📥 Normalizando y guardando {len(raw_findings)} señales...")
                    count = 0
                    for raw in raw_findings:
                        signal = normalizer.normalize_reddit(raw)
                        if db.save_signal(signal):
                            count += 1
                    print(f"   ✅ {count} señales de Reddit guardadas en DB.")
                else:
                    print("   😴 Sin actividad relevante en Reddit.")
                
                last_run_reddit = current_time

            except Exception as e:
                print(f"   ❌ Error en ciclo Reddit: {e}")

        # ---------------------------------------------------------
        # B. CICLO TRENDS (Phantom Demand)
        # ---------------------------------------------------------
        if current_time - last_run_trends > INTERVAL_TRENDS:
            print(f"\n[{time.strftime('%H:%M:%S')}] 🟢 Iniciando ciclo Google Trends...")
            try:
                opportunities = trends_engine.detect_phantom_demand(TARGET_KEYWORDS)
                
                if opportunities:
                    print(f"   📥 Normalizando y guardando {len(opportunities)} oportunidades...")
                    count = 0
                    for opp in opportunities:
                        signal = normalizer.normalize_trends(opp)
                        if db.save_signal(signal):
                            count += 1
                    print(f"   ✅ {count} oportunidades de Trends guardadas en DB.")
                else:
                    print("   📉 Mercado estable (sin picos detectados).")
                
                last_run_trends = current_time

            except Exception as e:
                print(f"   ❌ Error en ciclo Trends: {e}")

        # ---------------------------------------------------------
        # C. CONTROL DE RECURSOS
        # ---------------------------------------------------------
        # Pequeña pausa para no saturar CPU en el while True
        time.sleep(10)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n🛑 DETENIENDO SISTEMA SCOUT...")
        print("✅ Ejecución finalizada por el usuario. ¡Hasta pronto!")
        try:
            sys.exit(0)
        except SystemExit:
            os._exit(0)