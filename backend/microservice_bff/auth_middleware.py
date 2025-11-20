import firebase_admin
from firebase_admin import auth, credentials
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from typing import Dict

# Inicialización Singleton de Firebase Admin
# Ruta al service account key en el directorio backend
SERVICE_ACCOUNT_PATH = "../serviceAccountKey.json"

if not firebase_admin._apps:
    try:
        # Intentar usar el archivo de service account específico
        if os.path.exists(SERVICE_ACCOUNT_PATH):
            cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase Admin inicializado con Service Account")
        else:
            # Fallback a credentials por defecto del entorno
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred)
            print("✅ Firebase Admin inicializado con Application Default Credentials")
    except Exception as e:
        print(f"❌ Error inicializando Firebase Admin: {e}")
        # En desarrollo, podrías querer continuar sin Firebase para testing

security = HTTPBearer()

def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> Dict:
    """
    Decodifica y valida el token JWT de Firebase.
    Lanza 401 si el token es inválido, expirado o revocado.
    """
    token = credentials.credentials
    try:
        # verify_id_token chequea firma, expiración y audiencia
        decoded_token = auth.verify_id_token(token)
        
        # Opcional: Verificar si el email está verificado
        if not decoded_token.get("email_verified", False):
             # Dependiendo de la política de seguridad, podrías bloquear aquí
             pass
             
        return decoded_token
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado. Por favor refresca tu sesión.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Credenciales inválidas: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Dependencia reutilizable para inyección en rutas
def get_current_user(user: Dict = Depends(verify_firebase_token)) -> Dict:
    return user