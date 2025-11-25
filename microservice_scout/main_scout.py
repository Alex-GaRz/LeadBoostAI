import time
import os
import sys
import logging
import warnings
from datetime import datetime
from dotenv import load_dotenv
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.events import EVENT_JOB_ERROR, EVENT_JOB_EXECUTED

# --- FIX 1: Forzar UTF-8 en Windows para soportar Emojis ---
# Esto evita el "UnicodeEncodeError" en la consola
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        # En versiones muy viejas de Python esto podría fallar, pero en 3.10+ funciona
        pass

# --- FIX 2: Silenciar advertencias ruidosas de librerías externas (Pandas/Pytrends) ---
warnings.filterwarnings("ignore", category=FutureWarning)

from core.db_adapter import DBAdapter
from core.reddit_scout import RedditScout
from core.trends_scout import TrendsScout
from core.scout_normalizer import ScoutNormalizer

# Configuración de Logging Profesional con UTF-8 explícito
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(name)s] - %(levelname)s - %(message)s',
    handlers=[
        # Guardar en archivo con codificación segura
        logging.FileHandler("scout_service.log", encoding='utf-8'),
        # Imprimir en consola usando el stdout reconfigurado
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("ScoutOrchestrator")

# Cargar entorno
load_dotenv()

class ScoutService:
    def __init__(self):
        self.db = DBAdapter()
        self.normalizer = ScoutNormalizer()
        self.reddit_scout = RedditScout()
        self.trends_scout = TrendsScout()

    def job_reddit_intelligence(self):
        """
        Ciclo de Inteligencia de Reddit (Opinión Pública y Pain Points)
        Frecuencia: Alta (cada 60 min)
        """
        logger.info("🚀 [REDDIT] Iniciando escaneo de subreddits...")
        try:
            target_subreddits = ["marketing", "smallbusiness", "entrepreneur", "saas", "growthhacking"]
            pain_keywords = ["hate", "expensive", "problem with", "alternative to", "sucks", "nightmare"]
            
            raw_pain_points = self.reddit_scout.hunt_pain_points(target_subreddits, pain_keywords)
            
            count = 0
            for post in raw_pain_points:
                signal = self.normalizer.normalize_reddit(post)
                if self.db.save_signal(signal):
                    count += 1
            
            logger.info(f"✅ [REDDIT] Ciclo finalizado. Nuevas señales: {count}")
        except Exception as e:
            logger.error(f"❌ [REDDIT] Error crítico en job: {str(e)}", exc_info=True)

    def job_trends_intelligence(self):
        """
        Ciclo de Inteligencia de Mercado (Google Trends)
        Frecuencia: Media (cada 4 horas)
        """
        logger.info("🚀 [TRENDS] Iniciando detección de picos de tendencia...")
        try:
            target_keywords = ["AI marketing", "Lead generation", "Automated ads", "CRM automation"]
            
            raw_spikes = self.trends_scout.detect_silent_spikes(target_keywords)
            
            count = 0
            for spike in raw_spikes:
                signal = self.normalizer.normalize_trends(spike)
                if self.db.save_signal(signal):
                    count += 1
                    
            logger.info(f"✅ [TRENDS] Ciclo finalizado. Nuevas señales: {count}")
        except Exception as e:
            logger.error(f"❌ [TRENDS] Error crítico en job: {str(e)}", exc_info=True)

def listener(event):
    if event.exception:
        logger.warning(f"⚠️ El job {event.job_id} falló.")
    else:
        logger.info(f"Job {event.job_id} ejecutado exitosamente.")

def main():
    print("=========================================")
    print("   LEADBOOST AI - MICROSERVICE SCOUT")
    print("   Production Scheduler (APScheduler)")
    print("=========================================")

    service = ScoutService()
    scheduler = BlockingScheduler()
    
    # Listener para monitoreo de salud de jobs
    scheduler.add_listener(listener, EVENT_JOB_EXECUTED | EVENT_JOB_ERROR)

    # Configuración de Intervalos (Variables de entorno con fallbacks seguros)
    reddit_interval = int(os.getenv("SCOUT_REDDIT_INTERVAL_MIN", 60))
    trends_interval = int(os.getenv("SCOUT_TRENDS_INTERVAL_HOURS", 4))

    # Job 1: Reddit
    scheduler.add_job(
        service.job_reddit_intelligence,
        trigger=IntervalTrigger(minutes=reddit_interval),
        id='reddit_scout_job',
        name='Reddit Intelligence Cycle',
        next_run_time=datetime.now() # Ejecutar inmediatamente al inicio
    )

    # Job 2: Trends
    scheduler.add_job(
        service.job_trends_intelligence,
        trigger=IntervalTrigger(hours=trends_interval),
        id='trends_scout_job',
        name='Google Trends Cycle',
        next_run_time=datetime.now()
    )

    logger.info(f"🕒 Scheduler iniciado. Reddit: {reddit_interval}min | Trends: {trends_interval}h")
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("🛑 Deteniendo Scout Service...")

if __name__ == "__main__":
    main()