"""
Mutual TLS (mTLS) Configuration
RFC-PHOENIX-03: Fase 3 - Autenticación de Transporte

Configura FastAPI y clientes HTTP para requerir certificados X.509 cliente-servidor.
"""

import ssl
import logging
from pathlib import Path
from typing import Optional
import httpx
from fastapi import Request, HTTPException, status

from .secrets import secret_manager

logger = logging.getLogger("mTLS")


class MTLSConfig:
    """Configuración centralizada de mTLS"""
    
    def __init__(self, service_name: str):
        self.service_name = service_name
        self.certs_dir = Path(__file__).parent.parent.parent / "certs" / service_name
        
        # Paths de certificados
        self.ca_cert_path = self.certs_dir / "ca.crt"
        self.server_cert_path = self.certs_dir / "server.crt"
        self.server_key_path = self.certs_dir / "server.key"
        self.client_cert_path = self.certs_dir / "client.crt"
        self.client_key_path = self.certs_dir / "client.key"
        
        # Modo de operación
        self.mtls_enabled = secret_manager.get_secret("MTLS_ENABLED", "false").lower() == "true"
        self.mtls_mode = secret_manager.get_secret("MTLS_MODE", "permissive")  # strict | permissive
        
        if self.mtls_enabled:
            logger.info(f"🔒 mTLS habilitado para '{service_name}' (modo: {self.mtls_mode})")
            self._validate_certificates()
        else:
            logger.warning(f"⚠️  mTLS deshabilitado para '{service_name}' (solo desarrollo)")
    
    def _validate_certificates(self):
        """Valida que existan los certificados requeridos"""
        required_files = []
        
        if self.mtls_mode == "strict":
            required_files = [
                self.ca_cert_path,
                self.server_cert_path,
                self.server_key_path,
                self.client_cert_path,
                self.client_key_path
            ]
        
        missing = [f for f in required_files if not f.exists()]
        
        if missing:
            logger.error(f"❌ Certificados faltantes: {[str(f) for f in missing]}")
            raise FileNotFoundError(
                f"Certificados requeridos no encontrados. "
                f"Ejecuta: python scripts/generate_certificates.py"
            )
        
        logger.info(f"✅ Certificados validados para '{self.service_name}'")
    
    def get_ssl_context_server(self) -> Optional[ssl.SSLContext]:
        """
        Crea contexto SSL para servidor (FastAPI/uvicorn).
        
        Returns:
            SSLContext configurado o None si mTLS deshabilitado
        """
        if not self.mtls_enabled:
            return None
        
        context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
        
        # Cargar certificado del servidor
        context.load_cert_chain(
            certfile=str(self.server_cert_path),
            keyfile=str(self.server_key_path)
        )
        
        if self.mtls_mode == "strict":
            # Requerir certificado del cliente
            context.verify_mode = ssl.CERT_REQUIRED
            context.load_verify_locations(cafile=str(self.ca_cert_path))
            logger.info("🔐 Servidor: certificado de cliente REQUERIDO")
        else:
            # Modo permisivo: certificado opcional
            context.verify_mode = ssl.CERT_OPTIONAL
            logger.info("🔓 Servidor: certificado de cliente OPCIONAL")
        
        return context
    
    def get_ssl_context_client(self) -> Optional[ssl.SSLContext]:
        """
        Crea contexto SSL para cliente HTTP.
        
        Returns:
            SSLContext configurado o None si mTLS deshabilitado
        """
        if not self.mtls_enabled:
            return None
        
        context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)
        
        # Cargar CA para validar servidor
        context.load_verify_locations(cafile=str(self.ca_cert_path))
        
        if self.mtls_mode == "strict":
            # Enviar nuestro certificado al servidor
            context.load_cert_chain(
                certfile=str(self.client_cert_path),
                keyfile=str(self.client_key_path)
            )
            logger.info("🔐 Cliente: enviando certificado al servidor")
        else:
            logger.info("🔓 Cliente: modo permisivo")
        
        return context
    
    def create_http_client(self, base_url: str) -> httpx.AsyncClient:
        """
        Crea un cliente HTTP con mTLS configurado.
        
        Args:
            base_url: URL base del servicio destino
        
        Returns:
            httpx.AsyncClient configurado con mTLS
        """
        ssl_context = self.get_ssl_context_client()
        
        if ssl_context:
            # Cliente con mTLS
            client = httpx.AsyncClient(
                base_url=base_url,
                verify=ssl_context,
                timeout=30.0
            )
            logger.info(f"✅ Cliente HTTP con mTLS creado: {base_url}")
        else:
            # Cliente sin mTLS (desarrollo)
            client = httpx.AsyncClient(
                base_url=base_url,
                timeout=30.0
            )
            logger.warning(f"⚠️  Cliente HTTP SIN mTLS: {base_url}")
        
        return client


class MTLSMiddleware:
    """
    Middleware FastAPI para validar certificados cliente.
    
    Uso:
        from core.security.mtls_config import MTLSMiddleware
        
        mtls = MTLSMiddleware("actuator")
        app.middleware("http")(mtls)
    """
    
    def __init__(self, service_name: str):
        self.config = MTLSConfig(service_name)
    
    async def __call__(self, request: Request, call_next):
        """Valida el certificado del cliente"""
        
        if not self.config.mtls_enabled or self.config.mtls_mode != "strict":
            # mTLS deshabilitado o permisivo: permitir todo
            return await call_next(request)
        
        # Extraer información del certificado cliente (si existe)
        # Nota: Esto requiere que uvicorn/hypercorn pase los datos del certificado
        client_cert = request.scope.get("transport", {}).get("peercert")
        
        if not client_cert:
            logger.warning("⛔ Conexión rechazada: sin certificado cliente")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Certificado cliente requerido (mTLS)"
            )
        
        # Extraer Common Name (CN) del certificado
        subject = dict(x[0] for x in client_cert.get("subject", []))
        cn = subject.get("commonName")
        
        logger.info(f"✅ Certificado cliente validado: CN={cn}")
        
        # Agregar info del certificado al request (para logging)
        request.state.client_cn = cn
        
        response = await call_next(request)
        return response


def configure_uvicorn_ssl(config: MTLSConfig) -> dict:
    """
    Genera configuración para uvicorn con SSL/TLS.
    
    Args:
        config: Instancia de MTLSConfig
    
    Returns:
        Diccionario con parámetros ssl para uvicorn.run()
    
    Uso:
        mtls_config = MTLSConfig("actuator")
        ssl_params = configure_uvicorn_ssl(mtls_config)
        
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8000,
            **ssl_params
        )
    """
    if not config.mtls_enabled:
        return {}
    
    params = {
        "ssl_certfile": str(config.server_cert_path),
        "ssl_keyfile": str(config.server_key_path),
    }
    
    if config.mtls_mode == "strict":
        params["ssl_ca_certs"] = str(config.ca_cert_path)
        params["ssl_cert_reqs"] = ssl.CERT_REQUIRED
    
    return params


# Cache de configuraciones por servicio
_mtls_configs = {}


def get_mtls_config(service_name: str) -> MTLSConfig:
    """
    Obtiene o crea una configuración mTLS para un servicio.
    
    Args:
        service_name: Nombre del servicio (ej: "actuator", "enterprise")
    
    Returns:
        Instancia de MTLSConfig (singleton por servicio)
    """
    if service_name not in _mtls_configs:
        _mtls_configs[service_name] = MTLSConfig(service_name)
    
    return _mtls_configs[service_name]
