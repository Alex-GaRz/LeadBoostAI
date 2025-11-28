import numpy as np
import joblib
import os
from sklearn.linear_model import SGDRegressor
from sklearn.preprocessing import StandardScaler
from typing import Tuple

MODEL_PATH = "model_store/roi_model.pkl"
SCALER_PATH = "model_store/scaler.pkl"

class ROIPredictor:
    def __init__(self):
        self.is_fitted = False
        # Ajustamos a 'constant' con eta0 alto para que aprenda RÁPIDO en la demo
        self.model = SGDRegressor(
            loss='squared_error', 
            penalty='l2', 
            alpha=0.0001, 
            learning_rate='constant', 
            eta0=0.01, # Learning rate agresivo para ver cambios inmediatos
            max_iter=1000
        )
        self.scaler = StandardScaler()
        self.platform_map = {"META": 0, "GOOGLE": 1, "TIKTOK": 2, "LINKEDIN": 3}
        self.training_count = 0
        
        self._load_model()
        
        # FIX CRÍTICO: Si es nuevo, inicializamos el scaler con un rango teórico
        # para evitar que colapse con 1 solo dato.
        if not self.is_fitted:
            self._initialize_scaler_priors()

    def _initialize_scaler_priors(self):
        """
        Enseña al scaler qué es un presupuesto 'normal' antes de tener datos reales.
        Rango teórico: Budget $100 - $50,000 | CTR 0.1% - 5%
        """
        # Datos dummy para establecer escala: [Log(Budget), Platform, CTR]
        dummy_data = np.array([
            [np.log1p(100.0), 0, 0.001],   # Mínimo esperado
            [np.log1p(50000.0), 3, 0.05]   # Máximo esperado
        ])
        self.scaler.fit(dummy_data)

    def _feature_engineering(self, budget: float, platform_id: str, historical_ctr: float) -> np.ndarray:
        log_budget = np.log1p(budget)
        p_code = self.platform_map.get(platform_id.upper(), -1)
        features = np.array([[log_budget, p_code, historical_ctr]])
        return features

    def predict_roi(self, budget: float, platform_id: str, historical_ctr: float) -> Tuple[float, float]:
        if not self.is_fitted:
            return 1.2, 0.1 # Cold Start

        X = self._feature_engineering(budget, platform_id, historical_ctr)
        X_scaled = self.scaler.transform(X)
        
        prediction = self.model.predict(X_scaled)[0]
        
        # Confianza basada en volumen
        confidence = min(1.0, self.training_count / 20.0) # Satura más rápido para la demo (20 muestras)
        
        return max(0.0, prediction), confidence

    def train_incremental(self, budget: float, platform_id: str, historical_ctr: float, actual_roi: float):
        X = self._feature_engineering(budget, platform_id, historical_ctr)
        y = np.array([actual_roi])

        # Scaler ya está inicializado, usamos partial_fit para ajustarlo suavemente
        self.scaler.partial_fit(X)
        X_scaled = self.scaler.transform(X)

        self.model.partial_fit(X_scaled, y)
        
        self.is_fitted = True
        self.training_count += 1
        self._save_model()

    def _save_model(self):
        if not os.path.exists("model_store"):
            os.makedirs("model_store")
        joblib.dump(self.model, MODEL_PATH)
        joblib.dump(self.scaler, SCALER_PATH)
        joblib.dump(self.training_count, "model_store/meta_count.pkl")

    def _load_model(self):
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                self.scaler = joblib.load(SCALER_PATH)
                if os.path.exists("model_store/meta_count.pkl"):
                    self.training_count = joblib.load("model_store/meta_count.pkl")
                self.is_fitted = True
            except Exception as e:
                print(f"[MathCore] Warning: Corrupt model files. Starting fresh. {e}")