"""Domain-specific exceptions."""

class ActuatorException(Exception):
    """Base exception for Actuator service."""
    pass

class GovernanceViolationError(ActuatorException):
    """Raised when action is not approved by governance."""
    pass

class PlatformError(ActuatorException):
    """Raised when external platform call fails."""
    pass

class AuthenticationError(ActuatorException):
    """Raised when platform authentication fails."""
    pass
