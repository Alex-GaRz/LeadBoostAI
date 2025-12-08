"""
Secret Management Abstraction Layer
RFC-PHOENIX-03: Fase 3 - Gestión de Secretos

Provee una interfaz unificada para acceder a secretos desde múltiples backends:
- LocalSecretProvider: Variables de entorno (desarrollo)
- VaultSecretProvider: HashiCorp Vault (producción)
- KMSSecretProvider: AWS KMS / GCP Secret Manager (cloud)

PROHIBIDO acceder directamente a os.getenv() en código de negocio.
"""

import os
import logging
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from enum import Enum
import json

logger = logging.getLogger("SecretManager")


class SecretProviderType(Enum):
    """Tipos de proveedores de secretos soportados"""
    LOCAL = "local"  # Desarrollo: .env / variables de entorno
    VAULT = "vault"  # HashiCorp Vault
    AWS_KMS = "aws_kms"  # AWS Key Management Service
    GCP_SECRET = "gcp_secret"  # Google Cloud Secret Manager


class SecretProvider(ABC):
    """Interfaz abstracta para proveedores de secretos"""
    
    @abstractmethod
    def get_secret(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """Obtiene un secreto por su clave"""
        pass
    
    @abstractmethod
    def get_secrets(self, keys: list[str]) -> Dict[str, Optional[str]]:
        """Obtiene múltiples secretos de una vez (batch)"""
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """Verifica si el proveedor está disponible y operativo"""
        pass


class LocalSecretProvider(SecretProvider):
    """
    Proveedor de secretos basado en variables de entorno.
    Solo para desarrollo. NO usar en producción.
    """
    
    def __init__(self):
        logger.warning("⚠️  LocalSecretProvider activado. Solo para desarrollo.")
        self._cache: Dict[str, str] = {}
    
    def get_secret(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """Lee secreto desde variable de entorno"""
        if key in self._cache:
            return self._cache[key]
        
        value = os.getenv(key, default)
        if value:
            self._cache[key] = value
            logger.debug(f"Secret '{key}' cargado desde entorno")
        else:
            logger.warning(f"Secret '{key}' no encontrado")
        
        return value
    
    def get_secrets(self, keys: list[str]) -> Dict[str, Optional[str]]:
        """Obtiene múltiples secretos"""
        return {key: self.get_secret(key) for key in keys}
    
    def is_available(self) -> bool:
        """Siempre disponible (lee del sistema operativo)"""
        return True


class VaultSecretProvider(SecretProvider):
    """
    Proveedor de secretos para HashiCorp Vault.
    Interfaz preparada para futura implementación.
    """
    
    def __init__(self, vault_addr: str, token: str, mount_point: str = "secret"):
        self.vault_addr = vault_addr
        self.token = token
        self.mount_point = mount_point
        self._client = None
        logger.info(f"VaultSecretProvider inicializado: {vault_addr}")
    
    def get_secret(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """Obtiene secreto desde Vault"""
        # TODO: Implementar usando hvac (HashiCorp Vault client)
        raise NotImplementedError("VaultSecretProvider pendiente de implementación")
    
    def get_secrets(self, keys: list[str]) -> Dict[str, Optional[str]]:
        raise NotImplementedError("VaultSecretProvider pendiente de implementación")
    
    def is_available(self) -> bool:
        # TODO: Verificar conectividad con Vault
        return False


class KMSSecretProvider(SecretProvider):
    """
    Proveedor de secretos para AWS KMS / GCP Secret Manager.
    Interfaz preparada para futura implementación.
    """
    
    def __init__(self, provider: str, region: str = None):
        self.provider = provider  # "aws" o "gcp"
        self.region = region
        logger.info(f"KMSSecretProvider inicializado: {provider}")
    
    def get_secret(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """Obtiene secreto desde KMS"""
        # TODO: Implementar usando boto3 (AWS) o google-cloud-secret-manager (GCP)
        raise NotImplementedError("KMSSecretProvider pendiente de implementación")
    
    def get_secrets(self, keys: list[str]) -> Dict[str, Optional[str]]:
        raise NotImplementedError("KMSSecretProvider pendiente de implementación")
    
    def is_available(self) -> bool:
        return False


class SecretManager:
    """
    Singleton centralizado para gestión de secretos.
    
    Uso:
        from core.security.secrets import secret_manager
        
        api_key = secret_manager.get_secret("OPENAI_API_KEY")
        db_url = secret_manager.get_secret("DATABASE_URL", "postgresql://localhost")
    """
    
    _instance: Optional['SecretManager'] = None
    _provider: Optional[SecretProvider] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._provider is None:
            # Auto-detect provider basado en variables de entorno
            self._initialize_provider()
    
    def _initialize_provider(self):
        """Detecta y configura el proveedor apropiado"""
        provider_type = os.getenv("SECRET_PROVIDER", "local").lower()
        
        if provider_type == "vault":
            vault_addr = os.getenv("VAULT_ADDR")
            vault_token = os.getenv("VAULT_TOKEN")
            if vault_addr and vault_token:
                self._provider = VaultSecretProvider(vault_addr, vault_token)
                logger.info("✅ Vault Secret Provider configurado")
            else:
                logger.warning("⚠️  Vault configurado pero faltan credenciales. Fallback a Local.")
                self._provider = LocalSecretProvider()
        
        elif provider_type in ["aws_kms", "gcp_secret"]:
            # Futura implementación
            logger.warning(f"⚠️  {provider_type} no implementado. Fallback a Local.")
            self._provider = LocalSecretProvider()
        
        else:
            # Default: Local (desarrollo)
            self._provider = LocalSecretProvider()
        
        if not self._provider.is_available():
            logger.error("❌ Secret Provider no disponible. Usando fallback local.")
            self._provider = LocalSecretProvider()
    
    def get_secret(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """
        Obtiene un secreto de forma segura.
        
        Args:
            key: Nombre del secreto
            default: Valor por defecto si no existe
        
        Returns:
            Valor del secreto o None
        """
        try:
            return self._provider.get_secret(key, default)
        except Exception as e:
            logger.error(f"Error obteniendo secreto '{key}': {e}")
            return default
    
    def get_secrets(self, keys: list[str]) -> Dict[str, Optional[str]]:
        """Obtiene múltiples secretos (batch operation)"""
        try:
            return self._provider.get_secrets(keys)
        except Exception as e:
            logger.error(f"Error obteniendo secretos en batch: {e}")
            return {key: None for key in keys}
    
    def get_json_secret(self, key: str, default: Optional[Dict] = None) -> Optional[Dict]:
        """Obtiene un secreto en formato JSON"""
        value = self.get_secret(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError as e:
                logger.error(f"Error parseando JSON del secreto '{key}': {e}")
        return default
    
    def require_secret(self, key: str) -> str:
        """
        Obtiene un secreto requerido. Lanza excepción si no existe.
        
        Raises:
            ValueError: Si el secreto no existe
        """
        value = self.get_secret(key)
        if value is None:
            raise ValueError(f"Secret requerido no encontrado: {key}")
        return value
    
    def reload(self):
        """Recarga la configuración del proveedor (útil para rotación)"""
        logger.info("🔄 Recargando Secret Manager...")
        self._initialize_provider()


# Singleton global
secret_manager = SecretManager()


# Helper functions para compatibilidad
def get_secret(key: str, default: Optional[str] = None) -> Optional[str]:
    """Función helper para acceso directo"""
    return secret_manager.get_secret(key, default)


def require_secret(key: str) -> str:
    """Función helper para secretos requeridos"""
    return secret_manager.require_secret(key)


# Alias común
get = get_secret
