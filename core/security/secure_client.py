"""
Secure HTTP Client
RFC-PHOENIX-03: Fase 3 - Cliente HTTP con mTLS y JWT

Cliente HTTP que automáticamente:
1. Obtiene tokens JWT del STS
2. Configura mTLS (certificados cliente)
3. Adjunta tokens en requests
4. Maneja renovación automática
"""

import logging
import httpx
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import asyncio

from .secrets import secret_manager
from .mtls_config import get_mtls_config
from .sts import sts_service

logger = logging.getLogger("SecureHTTPClient")


class SecureServiceClient:
    """
    Cliente HTTP seguro para comunicación entre microservicios.
    
    Uso:
        client = SecureServiceClient(
            service_name="actuator",
            sts_url="http://enterprise:8011/sts/token"
        )
        
        response = await client.post(
            "http://actuator:8002/actuate",
            json={"action": "create_campaign"}
        )
    """
    
    def __init__(
        self,
        service_name: str,
        sts_url: str = "http://enterprise:8011/sts/token",
        client_secret: Optional[str] = None
    ):
        self.service_name = service_name
        self.service_id = f"svc.{service_name}"
        self.sts_url = sts_url
        
        # Client secret para obtener tokens (CORRECCIÓN CRÍTICA: sin fallback)
        self.client_secret = client_secret or secret_manager.require_secret(
            f"{service_name.upper()}_CLIENT_SECRET"
        )
        
        if not self.client_secret:
            raise ValueError(
                f"Client secret requerido para servicio '{service_name}'. "
                f"Configurar {service_name.upper()}_CLIENT_SECRET en SecretManager."
            )
        
        # Token management
        self._token: Optional[str] = None
        self._token_expires_at: Optional[datetime] = None
        
        # mTLS configuration
        self.mtls_config = get_mtls_config(service_name)
        
        # HTTP clients (con y sin mTLS)
        self._init_clients()
        
        logger.info(f"✅ SecureServiceClient inicializado: {self.service_id}")
    
    def _init_clients(self):
        """Inicializa clientes HTTP"""
        
        # Cliente para STS (sin mTLS, usa HTTP básico)
        self._sts_client = httpx.AsyncClient(timeout=10.0)
        
        # Cliente para comunicación servicio-a-servicio (con mTLS)
        ssl_context = self.mtls_config.get_ssl_context_client()
        
        if ssl_context:
            self._service_client = httpx.AsyncClient(
                verify=ssl_context,
                timeout=30.0
            )
            logger.info("🔐 Cliente con mTLS configurado")
        else:
            self._service_client = httpx.AsyncClient(timeout=30.0)
            logger.warning("⚠️  Cliente SIN mTLS (modo desarrollo)")
    
    async def _get_token(self) -> str:
        """
        Obtiene o renueva el token JWT del STS.
        
        Returns:
            Token JWT válido
        """
        
        # Verificar si tenemos token válido
        if self._token and self._token_expires_at:
            # Renovar si expira en menos de 2 minutos
            if datetime.utcnow() < self._token_expires_at - timedelta(minutes=2):
                return self._token
        
        logger.info(f"🎫 Solicitando token para '{self.service_id}' al STS...")
        
        try:
            response = await self._sts_client.post(
                self.sts_url,
                json={
                    "service_id": self.service_id,
                    "client_secret": self.client_secret
                }
            )
            
            response.raise_for_status()
            
            data = response.json()
            self._token = data["access_token"]
            expires_in = data.get("expires_in", 900)  # 15 minutos por defecto
            
            self._token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
            
            logger.info(f"✅ Token obtenido (expira en {expires_in}s)")
            
            return self._token
        
        except httpx.HTTPStatusError as e:
            logger.error(f"❌ Error obteniendo token: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"❌ Error conectando al STS: {e}")
            raise
    
    async def request(
        self,
        method: str,
        url: str,
        **kwargs
    ) -> httpx.Response:
        """
        Realiza una petición HTTP autenticada.
        
        Args:
            method: Método HTTP (GET, POST, etc.)
            url: URL completa del endpoint
            **kwargs: Argumentos adicionales para httpx
        
        Returns:
            httpx.Response
        """
        
        # Obtener token
        token = await self._get_token()
        
        # Agregar header de autorización
        headers = kwargs.get("headers", {})
        headers["Authorization"] = f"Bearer {token}"
        kwargs["headers"] = headers
        
        # Realizar petición
        try:
            response = await self._service_client.request(
                method=method,
                url=url,
                **kwargs
            )
            
            logger.debug(f"{method} {url} -> {response.status_code}")
            
            return response
        
        except httpx.HTTPStatusError as e:
            logger.error(f"❌ HTTP Error: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"❌ Request failed: {e}")
            raise
    
    async def get(self, url: str, **kwargs) -> httpx.Response:
        """GET request"""
        return await self.request("GET", url, **kwargs)
    
    async def post(self, url: str, **kwargs) -> httpx.Response:
        """POST request"""
        return await self.request("POST", url, **kwargs)
    
    async def put(self, url: str, **kwargs) -> httpx.Response:
        """PUT request"""
        return await self.request("PUT", url, **kwargs)
    
    async def delete(self, url: str, **kwargs) -> httpx.Response:
        """DELETE request"""
        return await self.request("DELETE", url, **kwargs)
    
    async def close(self):
        """Cierra las conexiones HTTP"""
        await self._sts_client.aclose()
        await self._service_client.aclose()
        logger.info("🔌 Cliente HTTP cerrado")
    
    async def __aenter__(self):
        """Context manager support"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager support"""
        await self.close()


# Factory function
def create_secure_client(service_name: str, sts_url: Optional[str] = None) -> SecureServiceClient:
    """
    Crea un cliente HTTP seguro para un servicio.
    
    Args:
        service_name: Nombre del servicio (sin prefijo 'svc.')
        sts_url: URL del STS (opcional)
    
    Returns:
        SecureServiceClient configurado
    """
    
    if sts_url is None:
        # Auto-detect desde configuración o usar default
        sts_url = secret_manager.get_secret(
            "STS_URL",
            "http://enterprise:8011/sts/token"
        )
    
    return SecureServiceClient(
        service_name=service_name,
        sts_url=sts_url
    )


# Ejemplo de uso con context manager
async def example_usage():
    """Ejemplo de cómo usar el cliente seguro"""
    
    async with create_secure_client("actuator") as client:
        # Hacer request autenticado
        response = await client.post(
            "http://actuator:8002/actuate",
            json={
                "action_type": "create_campaign",
                "parameters": {"budget": 1000}
            }
        )
        
        return response.json()


if __name__ == "__main__":
    # Test
    asyncio.run(example_usage())
