import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración OpenAI (si se usa directamente)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# URL del backend para proxy de AI (Opción recomendada)
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")

# Configuración Firebase (ya existente)
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "leadboost-ai-1966c")

# Configuración del sistema
ANOMALY_THRESHOLD_SIGMA = float(os.getenv('ANOMALY_THRESHOLD_SIGMA', 2.5))