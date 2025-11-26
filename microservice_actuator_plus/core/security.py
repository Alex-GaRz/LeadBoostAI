import os
from cryptography.fernet import Fernet

# CLAVE DE ENCRIPTACIÓN (En producción usar Var de Entorno)
# Esta clave es compatible con AES-256
FALLBACK_KEY = b't7w9_DkL5aJ3mR8uX1nZ0pQ2sY4vE6oB8hN9mL1kP3g='

def get_cipher():
    key = os.getenv("ENCRYPTION_KEY", FALLBACK_KEY)
    if isinstance(key, str):
        key = key.encode()
    return Fernet(key)

def encrypt_token(token: str) -> str:
    """Cifra un token de texto plano."""
    if not token: return ""
    return get_cipher().encrypt(token.encode()).decode()

def decrypt_token(encrypted_token: str) -> str:
    """Descifra un token para usarlo en la API."""
    if not encrypted_token: return ""
    try:
        return get_cipher().decrypt(encrypted_token.encode()).decode()
    except Exception:
        return None