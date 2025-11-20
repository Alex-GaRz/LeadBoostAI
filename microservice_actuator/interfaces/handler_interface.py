from abc import ABC, abstractmethod
from models.schemas import ActionProposal, ExecutionResult

class IActionHandler(ABC):
    """
    Interfaz base para todos los ejecutores de acciones.
    Usa el patrón Template Method implícito en la arquitectura.
    """
    
    @abstractmethod
    def execute(self, proposal: ActionProposal) -> ExecutionResult:
        """
        Ejecuta la acción en el mundo real (o simulación).
        Debe manejar sus propias excepciones y retornar un ExecutionResult.
        """
        pass