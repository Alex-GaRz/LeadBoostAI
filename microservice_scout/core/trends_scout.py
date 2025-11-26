import time
import pandas as pd
from pytrends.request import TrendReq
from datetime import datetime, timezone
import random
import warnings
warnings.simplefilter(action='ignore', category=FutureWarning)

class TrendsScout:
    """
    Detector de 'Demanda Fantasma' usando Google Trends.
    Busca picos estadísticos de interés de búsqueda recientes.
    """

    def __init__(self, region='US', language='en-US'):
        # Inicializamos pytrends con retries para evitar errores de conexión
        # tz=360 es para US Central Standard Time
        self.pytrends = TrendReq(hl=language, tz=360, timeout=(10,25), retries=2, backoff_factor=0.1)
        self.region = region

    def detect_phantom_demand(self, keywords_list: list) -> list:
        """
        Analiza una lista de keywords y devuelve solo aquellas con un pico de demanda reciente.
        Regla: Interés últimos 3 días > 150% del promedio de los 27 días anteriores.
        """
        opportunities = []
        
        print(f"📊 [TrendsScout] Iniciando análisis de {len(keywords_list)} keywords...")

        for keyword in keywords_list:
            try:
                # Pausa aleatoria para evitar bloqueo 429 (Too Many Requests) de Google
                sleep_time = random.uniform(2, 5)
                time.sleep(sleep_time)
                
                # Solicitamos datos de los últimos 30 días
                self.pytrends.build_payload([keyword], cat=0, timeframe='today 1-m', geo=self.region)
                
                # Obtener interés en el tiempo
                data = self.pytrends.interest_over_time()

                if data.empty:
                    print(f"   Note: Sin datos para '{keyword}'")
                    continue

                # Limpieza de datos (eliminar columna isPartial si existe)
                if 'isPartial' in data.columns:
                    del data['isPartial']

                # Validar que tengamos suficientes datos (al menos 5 días)
                if len(data) < 5:
                    continue

                # --- ANÁLISIS ESTADÍSTICO ---
                # Serie temporal de interés
                trend_series = data[keyword]
                
                # 1. Promedio histórico (excluyendo los últimos 3 días)
                avg_30_days = trend_series.iloc[:-3].mean()
                
                # 2. Promedio reciente (últimos 3 días)
                current_volume = trend_series.iloc[-3:].mean()

                # Evitar división por cero
                if avg_30_days < 1: 
                    avg_30_days = 0.1

                # Calcular ratio de incremento
                increase_ratio = current_volume / avg_30_days
                increase_pct = (increase_ratio - 1) * 100

                # --- CRITERIO DE OPORTUNIDAD ---
                # A. Incremento > 150% (Ratio 1.5)
                # B. Volumen actual significativo (> 10/100) para evitar ruido de long-tail
                if increase_ratio >= 1.5 and current_volume > 10:
                    print(f"🚀 [OPORTUNIDAD] '{keyword}' | Pico: +{increase_pct:.1f}% | Vol: {current_volume:.1f}")
                    
                    opportunities.append({
                        "keyword": keyword,
                        "current_volume": round(current_volume, 2),
                        "avg_volume": round(avg_30_days, 2),
                        "increase_pct": round(increase_pct, 2),
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })
                else:
                    # Log opcional para debugging
                    # print(f"   Info: '{keyword}' estable. Cambio: {increase_pct:.1f}%")
                    pass

            except Exception as e:
                print(f"⚠️ [TrendsScout] Error analizando '{keyword}': {str(e)}")
                # Si hay error (ej. rate limit), esperamos más tiempo
                time.sleep(10)

        return opportunities