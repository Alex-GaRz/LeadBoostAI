
"""
SAGA Coordination Package
Event-driven SAGA orchestration with Kafka messaging
"""

from .messaging_saga_adapter import (
    MessagingSagaCoordinator,
    SagaDefinition,
    SagaStep,
    SagaStepType,
    SagaState,
    create_campaign_saga
)

__all__ = [
    'MessagingSagaCoordinator',
    'SagaDefinition',
    'SagaStep',
    'SagaStepType',
    'SagaState',
    'create_campaign_saga'
]
