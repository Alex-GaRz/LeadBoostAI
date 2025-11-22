import time
import pandas as pd
from pytrends.request import TrendReq
from datetime import datetime, timedelta

class TrendsScout:
    def __init__(self, hl='en-US', tz=360):
        self.pytrends = TrendReq(hl=hl, tz=tz, timeout=(10,25))
        self.backoff_factor = 2

    def detect_silent_spikes(self, keywords: list, threshold_pct=200) -> list:
        """
        Compara el volumen actual vs el promedio de 30 días.
        Si volumen > promedio * (threshold_pct/100) -> Señal.
        """
        detected_spikes = []
        # Pytrends permite max 5 keywords por request
        chunked_keywords = [keywords[i:i + 5] for i in range(0, len(keywords), 5)]

        print(f"📈 [TrendsScout] Analizando {len(keywords)} términos para picos de demanda...")

        for chunk in chunked_keywords:
            try:
                # Backoff simple para evitar 429 Too Many Requests
                time.sleep(self.backoff_factor)
                
                # Construir payload: últimos 30 días aprox ('today 1-m')
                self.pytrends.build_payload(chunk, cat=0, timeframe='today 1-m')
                
                # Obtener datos de interés en el tiempo
                data = self.pytrends.interest_over_time()
                
                if data.empty:
                    continue

                # Analizar cada keyword
                for kw in chunk:
                    if kw not in data.columns:
                        continue
                    
                    series = data[kw]
                    if len(series) < 5: continue # Datos insuficientes

                    # Último punto de datos (Demanda Actual)
                    current_volume = series.iloc[-1]
                    
                    # Promedio de los días anteriores (excluyendo hoy)
                    avg_volume = series.iloc[:-1].mean()

                    # Evitar división por cero o volúmenes insignificantes
                    if avg_volume < 1: avg_volume = 1

                    increase_pct = (current_volume / avg_volume) * 100

                    if increase_pct >= threshold_pct and current_volume > 10: # Filtro de ruido mínimo
                        print(f"🚨 [TrendsScout] SPIKE DETECTADO: {kw} (+{increase_pct:.1f}%)")
                        detected_spikes.append({
                            "keyword": kw,
                            "current_volume": current_volume,
                            "avg_volume": avg_volume,
                            "increase_pct": increase_pct
                        })

            except Exception as e:
                print(f"⚠️ [TrendsScout] Error API (posible rate limit): {e}")
                # Aumentar backoff temporalmente
                time.sleep(5) 

        return detected_spikes
