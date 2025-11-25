from datetime import datetime
from microservice_analyst.core.db_adapter import DBAdapter
from microservice_analyst.core.engine import ZScoreEngine
from microservice_analyst.core.trust import TrustScorer
from microservice_analyst.models.schemas import SignalInput, CriticalAlert

class AnalystService:
    def __init__(self):
        self.db = DBAdapter() # Inicializa conexión o simulación
        self.engine = ZScoreEngine(threshold=2.5) # Umbral ajustado

    def analyze_signal(self, signal: SignalInput):
        # 1. Obtener serie de tiempo (Real o Sintética)
        history = self.db.get_time_series(signal.source, hours=48)
        
        # 2. Valor actual
        current_val = float(signal.analysis.get('sentimentScore', 0))
        
        # 3. Detectar
        result = self.engine.detect(history, current_val)
        
        if not result.is_anomaly:
            return {"status": "ok", "score": result.score}

        # 4. Calcular Confianza
        trust = TrustScorer.calculate(signal.source, signal.metadata.get('aiConfidence', 0.8))

        # 5. Crear Alerta
        alert = CriticalAlert(
            signal_id=signal.id,
            timestamp=datetime.now(),
            type="SENTIMENT_ANOMALY",
            severity=result.severity,
            anomaly_score=result.score,
            trust_score=trust,
            context_data={"val": current_val, "details": result.details}
        )

        # 6. Guardar (El adaptador decide si va a DB o log)
        self.db.save_alert(alert.dict())
        
        return {"status": "ALERT_CREATED", "alert": alert}