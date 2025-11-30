import json
import logging
import numpy as np
from .postgres_adapter import PostgresAdapter


# Importamos el modelo matemático que ya tienes en la raíz
from microservice_optimizer.core.math_core import ROIPredictor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Trainer")

class ModelTrainer:
    def __init__(self, model_instance: ROIPredictor):
        self.db = PostgresAdapter()
        self.model = model_instance

    def process_pending_data(self):
        """Ciclo principal de re-entrenamiento"""
        signals = self.db.fetch_pending_signals(limit=20)
        
        if not signals:
            logger.info("💤 No hay datos nuevos para entrenar.")
            return

        logger.info(f"🧠 Procesando {len(signals)} nuevas señales para ajuste neuronal...")
        
        processed_ids = []
        
        for sig in signals:
            try:
                # Extraer datos
                payload = sig['payload']
                if isinstance(payload, str):
                    payload = json.loads(payload)
                
                # --- ALQUIMIA DE DATOS (Text to Math) ---
                # Aquí traducimos "sentimientos" a "números de ROI" para el modelo
                
                # 1. Analizar Keywords
                metadata = payload.get("scout_metadata", {})
                keywords = metadata.get("pain_keywords", [])
                source = sig["source"]
                
                # Valores base simulados para el entrenamiento incremental
                # En un sistema real, esto vendría de datos de conversión reales.
                # Aquí "enseñamos" al modelo basándonos en la intensidad del problema encontrado.
                
                simulated_budget = 1000.0
                simulated_ctr = 0.02 # 2% estándar
                target_roi = 1.5     # ROI base
                
                # HEURÍSTICA: Si hay "dolor" real, el ROI potencial sube
                if "problem" in keywords or "help" in keywords:
                    target_roi += 0.5 # +50% ROI esperado
                    simulated_ctr += 0.01
                
                if "expensive" in keywords or "fail" in keywords:
                    target_roi -= 0.3 # Mercado difícil
                    simulated_budget = 5000.0 # Requiere más presupuesto
                
                # Mapear fuente a plataforma ID para el modelo
                platform = "GOOGLE" # Default
                if "reddit" in source: platform = "LINKEDIN" # Proxies b2b
                if "tiktok" in source: platform = "TIKTOK"
                
                # --- ENTRENAMIENTO INCREMENTAL ---
                self.model.train_incremental(
                    budget=simulated_budget,
                    platform_id=platform,
                    historical_ctr=simulated_ctr,
                    actual_roi=target_roi
                )
                
                processed_ids.append(sig['id'])
                
            except Exception as e:
                logger.error(f"⚠️ Error procesando señal {sig.get('id')}: {e}")

        # Marcar como aprendidos en DB
        if processed_ids:
            self.db.mark_as_processed(processed_ids)
            logger.info(f"✅ Modelo actualizado con {len(processed_ids)} experiencias nuevas.")
            # Guardar el estado del modelo
            self.model._save_model()