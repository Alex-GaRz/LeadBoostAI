"""
Security Token Service (STS)
RFC-PHOENIX-03: Fase 3 - Autenticación Servicio-a-Servicio

Emite JWTs de corta duración para autenticación entre microservicios.
Soporta rotación de claves mediante Key ID (kid).
"""

import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, Optional, List
import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
import os

from .secrets import secret_manager

logger = logging.getLogger("STS")


class TokenClaims:
    """Claims estándar JWT para tokens de servicio"""
    
    def __init__(
        self,
        subject: str,  # Identidad del servicio (ej: "svc.actuator")
        role: str,     # Rol IAM (ej: "executor")
        scopes: List[str],  # Permisos (ej: ["execute:external", "read:approvals"])
        issuer: str = "leadboostai.sts",
        audience: str = "leadboostai.services",
        expiration_minutes: int = 15
    ):
        self.subject = subject
        self.role = role
        self.scopes = scopes
        self.issuer = issuer
        self.audience = audience
        self.issued_at = datetime.utcnow()
        self.expires_at = self.issued_at + timedelta(minutes=expiration_minutes)
        self.jti = str(uuid.uuid4())  # Unique token ID
    
    def to_dict(self) -> Dict:
        """Convierte a diccionario para JWT encoding"""
        return {
            "sub": self.subject,
            "role": self.role,
            "scope": " ".join(self.scopes),  # OAuth2 standard: space-separated
            "iss": self.issuer,
            "aud": self.audience,
            "iat": int(self.issued_at.timestamp()),
            "exp": int(self.expires_at.timestamp()),
            "jti": self.jti
        }


class SigningKey:
    """Representa una clave de firma con su ID"""
    
    def __init__(self, key_id: str, private_key: rsa.RSAPrivateKey, public_key: rsa.RSAPublicKey):
        self.key_id = key_id
        self.private_key = private_key
        self.public_key = public_key
        self.created_at = datetime.utcnow()
    
    def get_private_pem(self) -> bytes:
        """Exporta la clave privada en formato PEM"""
        return self.private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
    
    def get_public_pem(self) -> bytes:
        """Exporta la clave pública en formato PEM"""
        return self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )


class SecurityTokenService:
    """
    Servicio de emisión y validación de tokens JWT.
    
    Features:
    - Emisión de tokens de corta duración (15 minutos por defecto)
    - Rotación de claves (múltiples claves activas simultáneas)
    - Validación de firma, expiración y claims
    - Soporte para JWKS (JSON Web Key Set) endpoint
    """
    
    def __init__(self):
        self._signing_keys: Dict[str, SigningKey] = {}
        self._active_key_id: Optional[str] = None
        self._initialize_keys()
    
    def _initialize_keys(self):
        """Carga o genera las claves de firma"""
        # Intentar cargar clave existente desde secretos
        private_pem = secret_manager.get_secret("STS_PRIVATE_KEY")
        public_pem = secret_manager.get_secret("STS_PUBLIC_KEY")
        
        if private_pem and public_pem:
            logger.info("🔑 Cargando claves STS desde Secret Manager")
            try:
                private_key = serialization.load_pem_private_key(
                    private_pem.encode(),
                    password=None,
                    backend=default_backend()
                )
                public_key = serialization.load_pem_public_key(
                    public_pem.encode(),
                    backend=default_backend()
                )
                key_id = secret_manager.get_secret("STS_KEY_ID", "key-001")
                
                signing_key = SigningKey(key_id, private_key, public_key)
                self._signing_keys[key_id] = signing_key
                self._active_key_id = key_id
                
                logger.info(f"✅ Clave STS cargada: {key_id}")
            except Exception as e:
                logger.error(f"Error cargando claves: {e}. Generando nuevas...")
                self._generate_new_key()
        else:
            logger.warning("⚠️  Claves STS no encontradas. Generando...")
            self._generate_new_key()
    
    def _generate_new_key(self, key_id: Optional[str] = None) -> SigningKey:
        """Genera un nuevo par de claves RSA"""
        if key_id is None:
            key_id = f"key-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        
        logger.info(f"🔐 Generando nuevo par de claves: {key_id}")
        
        # Generar par RSA 2048 bits
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        public_key = private_key.public_key()
        
        signing_key = SigningKey(key_id, private_key, public_key)
        self._signing_keys[key_id] = signing_key
        
        if self._active_key_id is None:
            self._active_key_id = key_id
        
        logger.info(f"✅ Par de claves generado: {key_id}")
        
        # Guardar en archivos para persistencia (desarrollo)
        self._save_key_to_file(signing_key)
        
        return signing_key
    
    def _save_key_to_file(self, signing_key: SigningKey):
        """Guarda las claves en archivos (solo desarrollo)"""
        keys_dir = os.path.join(os.path.dirname(__file__), "../../certs/sts")
        os.makedirs(keys_dir, exist_ok=True)
        
        private_path = os.path.join(keys_dir, f"{signing_key.key_id}_private.pem")
        public_path = os.path.join(keys_dir, f"{signing_key.key_id}_public.pem")
        
        with open(private_path, "wb") as f:
            f.write(signing_key.get_private_pem())
        
        with open(public_path, "wb") as f:
            f.write(signing_key.get_public_pem())
        
        logger.info(f"💾 Claves guardadas en {keys_dir}")
    
    def issue_token(
        self,
        service_id: str,
        role: str,
        scopes: List[str],
        expiration_minutes: int = 15
    ) -> str:
        """
        Emite un nuevo token JWT para un servicio.
        
        Args:
            service_id: Identificador del servicio (ej: "svc.actuator")
            role: Rol IAM del servicio
            scopes: Lista de permisos
            expiration_minutes: Tiempo de vida del token
        
        Returns:
            Token JWT firmado (string)
        
        Raises:
            ValueError: Si no hay clave activa configurada
        """
        if not self._active_key_id:
            raise ValueError("No hay clave de firma activa")
        
        signing_key = self._signing_keys[self._active_key_id]
        
        # Crear claims
        claims = TokenClaims(
            subject=service_id,
            role=role,
            scopes=scopes,
            expiration_minutes=expiration_minutes
        )
        
        # Firmar JWT
        token = jwt.encode(
            payload=claims.to_dict(),
            key=signing_key.get_private_pem(),
            algorithm="RS256",
            headers={"kid": signing_key.key_id}
        )
        
        logger.info(f"🎫 Token emitido para '{service_id}' (rol: {role}, kid: {signing_key.key_id})")
        
        return token
    
    def validate_token(self, token: str, required_scopes: Optional[List[str]] = None) -> Dict:
        """
        Valida un token JWT y retorna sus claims.
        
        Args:
            token: Token JWT a validar
            required_scopes: Scopes requeridos (opcional)
        
        Returns:
            Diccionario con los claims del token
        
        Raises:
            jwt.ExpiredSignatureError: Token expirado
            jwt.InvalidTokenError: Token inválido
            ValueError: Scopes insuficientes
        """
        # Decodificar header para obtener kid
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        
        if not kid or kid not in self._signing_keys:
            raise jwt.InvalidTokenError(f"Key ID desconocido: {kid}")
        
        signing_key = self._signing_keys[kid]
        
        # Validar firma y claims
        payload = jwt.decode(
            token,
            key=signing_key.get_public_pem(),
            algorithms=["RS256"],
            audience="leadboostai.services",
            issuer="leadboostai.sts"
        )
        
        # Validar scopes si se requieren
        if required_scopes:
            token_scopes = payload.get("scope", "").split()
            missing_scopes = set(required_scopes) - set(token_scopes)
            
            if missing_scopes:
                raise ValueError(f"Scopes insuficientes. Faltan: {missing_scopes}")
        
        logger.debug(f"✅ Token validado: {payload.get('sub')} (kid: {kid})")
        
        return payload
    
    def rotate_keys(self) -> str:
        """
        Rota las claves de firma.
        Genera una nueva clave pero mantiene la anterior activa durante el grace period.
        
        Returns:
            Key ID de la nueva clave activa
        """
        new_key = self._generate_new_key()
        old_key_id = self._active_key_id
        self._active_key_id = new_key.key_id
        
        logger.warning(f"🔄 Rotación de claves: {old_key_id} -> {new_key.key_id}")
        logger.info("⚠️  Clave anterior aún válida durante grace period")
        
        return new_key.key_id
    
    def get_public_keys(self) -> Dict[str, Dict]:
        """
        Retorna las claves públicas en formato JWKS (JSON Web Key Set).
        Útil para que otros servicios validen tokens sin llamar al STS.
        """
        keys = []
        for kid, signing_key in self._signing_keys.items():
            public_pem = signing_key.get_public_pem().decode()
            keys.append({
                "kid": kid,
                "kty": "RSA",
                "use": "sig",
                "alg": "RS256",
                "key": public_pem
            })
        
        return {"keys": keys}
    
    def revoke_key(self, key_id: str):
        """Revoca una clave específica (la elimina del conjunto activo)"""
        if key_id in self._signing_keys:
            del self._signing_keys[key_id]
            logger.warning(f"🚫 Clave revocada: {key_id}")
            
            if self._active_key_id == key_id:
                # Si revocamos la activa, generamos una nueva
                self._generate_new_key()


# Singleton global
sts_service = SecurityTokenService()


# Helper functions
def issue_service_token(service_id: str, role: str, scopes: List[str]) -> str:
    """Función helper para emitir tokens"""
    return sts_service.issue_token(service_id, role, scopes)


def validate_service_token(token: str, required_scopes: Optional[List[str]] = None) -> Dict:
    """Función helper para validar tokens"""
    return sts_service.validate_token(token, required_scopes)
