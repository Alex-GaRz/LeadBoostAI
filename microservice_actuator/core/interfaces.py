"""Port Interfaces - Contracts for adapters (Hexagonal Architecture)."""

from abc import ABC, abstractmethod
from typing import Dict, Any
from .domain_models import ExecutionResult, ActionPayload

class ISocialPlatformAdapter(ABC):
    """
    Driven Port (Output Port).
    Defines generic capabilities required by the Actuator.
    All platform handlers MUST implement this interface.
    """

    @abstractmethod
    async def authenticate(self) -> bool:
        """
        Validates credentials with the external provider.
        Returns:
            bool: True if authentication successful, False otherwise.
        """
        pass

    @abstractmethod
    async def post_content(self, payload: ActionPayload) -> ExecutionResult:
        """
        Executes content publication to the platform.
        Must handle its own retries and rate limits.
        Returns:
            ExecutionResult: Result of the execution with platform ref ID.
        """
        pass

    @abstractmethod
    async def get_metrics(self, resource_id: str) -> Dict[str, Any]:
        """
        Retrieves post-execution metrics from the platform.
        Returns:
            Dict with metrics (impressions, clicks, etc).
        """
        pass
