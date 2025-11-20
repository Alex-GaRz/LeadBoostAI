import pandas as pd
import numpy as np
from models.schemas import AnomalyResult, Severity

class ZScoreEngine:
    def __init__(self, threshold: float = 3.0):
        self.threshold = threshold

    def detect(self, history: pd.DataFrame, current_value: float) -> AnomalyResult:
        if history.empty or len(history) < 5:
            return AnomalyResult(is_anomaly=False, score=0.0, severity=Severity.LOW, details="Insufficient data")

        mean = history['value'].mean()
        std = history['value'].std()

        if std == 0: std = 0.001 # Evitar división por cero

        z_score = (current_value - mean) / std
        abs_score = abs(z_score)
        
        is_anomaly = abs_score > self.threshold
        
        severity = Severity.LOW
        if is_anomaly:
            severity = Severity.CRITICAL if abs_score > (self.threshold * 2) else Severity.HIGH

        return AnomalyResult(
            is_anomaly=is_anomaly,
            score=round(float(z_score), 2),
            severity=severity,
            details=f"Value {current_value} is {z_score:.2f}σ from mean {mean:.2f}"
        )