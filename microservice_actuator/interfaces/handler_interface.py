from abc import ABC, abstractmethod
from microservice_actuator.models.schemas import ActionRequest, ExecutionResult

class IActionHandler(ABC):
    """Interfaz para todos los ejecutores de acciones (Handlers)."""
    
    @abstractmethod
    async def execute(self, action: ActionRequest) -> ExecutionResult:
        """
        Ejecuta la acción de manera ASÍNCRONA y retorna un resultado estandarizado.
        """
        pass