from abc import ABC, abstractmethod
from microservice_actuator.models.schemas import ActionRequest, ExecutionResult
from microservice_actuator.models.extended_schemas import AudienceSegment, CreativeAsset

class IPlatformHandler(ABC):
    @abstractmethod
    async def build_payload(self, action: ActionRequest, audience: AudienceSegment, creative: CreativeAsset) -> dict:
        """Construye el JSON específico que requiere la API de la plataforma"""
        pass
