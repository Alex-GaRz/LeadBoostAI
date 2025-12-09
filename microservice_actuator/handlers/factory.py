"""Handler Factory - Polymorphic instantiation of platform adapters."""

import logging
from core.interfaces import ISocialPlatformAdapter
from core.domain_models import PlatformType
from handlers.mock_handler import MockHandler

logger = logging.getLogger(__name__)


class HandlerFactory:
    """
    Factory for creating platform-specific handlers.
    Implements the Factory Pattern for plugin architecture.
    """
    
    @staticmethod
    def get_handler(platform: PlatformType) -> ISocialPlatformAdapter:
        """
        Returns the appropriate handler instance based on platform type.
        
        Args:
            platform: Target platform type.
            
        Returns:
            ISocialPlatformAdapter: Platform-specific handler instance.
            
        Raises:
            NotImplementedError: If platform handler not yet implemented.
        """
        logger.info(f"Factory: Requesting handler for platform {platform}")
        
        if platform == PlatformType.MOCK:
            return MockHandler()
        
        elif platform == PlatformType.TWITTER:
            # TODO: Implement TwitterHandler with OAuth 2.0
            raise NotImplementedError(
                "Twitter handler not yet implemented. "
                "See RFC-PHOENIX-04 Section 3.3 for implementation guide."
            )
        
        elif platform == PlatformType.META:
            # TODO: Implement MetaHandler for Facebook/Instagram
            raise NotImplementedError(
                "Meta (Facebook/Instagram) handler not yet implemented."
            )
        
        elif platform == PlatformType.LINKEDIN:
            # TODO: Implement LinkedInHandler
            raise NotImplementedError(
                "LinkedIn handler not yet implemented."
            )
        
        else:
            raise ValueError(f"Unknown platform type: {platform}")


def get_handler(platform_name: str) -> ISocialPlatformAdapter:
    """
    Convenience function for string-based platform selection.
    
    Args:
        platform_name: Platform name as string (e.g., "MOCK", "TWITTER").
        
    Returns:
        ISocialPlatformAdapter: Handler instance.
    """
    try:
        platform_enum = PlatformType(platform_name.upper())
        return HandlerFactory.get_handler(platform_enum)
    except ValueError as e:
        logger.error(f"Invalid platform name: {platform_name}")
        raise
