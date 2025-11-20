import json
import requests
from fastapi import HTTPException
from models.schemas import CriticalAlert, ActionProposal
from core.config import BACKEND_URL

class StrategyEngine:
    """
    Motor de toma de decisiones basado en LLM.
    Transforma Alertas Estadísticas -> Estrategias de Negocio.
    """

    def __init__(self):
        self.model = "gpt-4-turbo-preview" # O gpt-3.5-turbo-0125 para menor coste

    def generate_strategy(self, alert: CriticalAlert) -> ActionProposal:
        """
        Analiza una CriticalAlert y genera una propuesta estructurada.
        Usa el backend como proxy para OpenAI.
        """
        
        try:
            # Llamada al backend en lugar de OpenAI directamente
            response = requests.post(
                f"{BACKEND_URL}/api/ai/strategy",
                json={"alert": alert.model_dump()},
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Backend AI Error")
            
            # El backend ya devuelve el JSON procesado
            data = response.json()
            
            # Validamos contra nuestro modelo Pydantic
            proposal = ActionProposal(**data)
            
            return proposal

        except requests.exceptions.RequestException as e:
            print(f"Error comunicándose con backend: {str(e)}")
            raise HTTPException(status_code=500, detail="Backend Communication Failed")
        except json.JSONDecodeError:
            print("Error: El backend no devolvió un JSON válido.")
            raise HTTPException(status_code=500, detail="AI Output Error")
        except Exception as e:
            print(f"Error en StrategyEngine: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Strategy Generation Failed: {str(e)}")

# Instancia Singleton
strategy_engine = StrategyEngine()