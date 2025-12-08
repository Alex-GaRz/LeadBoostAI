"""
Security Middleware for FastAPI
RFC-PHOENIX-03: Fase 3 - Middleware de Seguridad

Valida tokens JWT, permisos RBAC y registra eventos de auditoría.
"""

import logging
from typing import Optional, List, Callable
from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

from .sts import validate_service_token
from .iam_policy import iam_enforcer, Permission
from .audit_logger import audit_logger, AuditEventType, AuditEvent, AuditSeverity

logger = logging.getLogger("SecurityMiddleware")

# Bearer token scheme
security_scheme = HTTPBearer(auto_error=False)


class SecurityContext:
    """
    Contexto de seguridad de una petición.
    Contiene información del actor autenticado y sus permisos.
    """
    
    def __init__(
        self,
        service_id: str,
        role: str,
        scopes: List[str],
        token_id: str,
        is_authenticated: bool = True
    ):
        self.service_id = service_id
        self.role = role
        self.scopes = scopes
        self.token_id = token_id
        self.is_authenticated = is_authenticated
    
    def has_scope(self, scope: str) -> bool:
        """Verifica si el contexto tiene un scope específico"""
        return scope in self.scopes
    
    def has_any_scope(self, scopes: List[str]) -> bool:
        """Verifica si tiene al menos uno de los scopes"""
        return any(s in self.scopes for s in scopes)
    
    def has_all_scopes(self, scopes: List[str]) -> bool:
        """Verifica si tiene todos los scopes"""
        return all(s in self.scopes for s in scopes)


async def get_security_context(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> SecurityContext:
    """
    Dependency para extraer y validar el contexto de seguridad.
    
    Uso:
        @app.get("/protected")
        async def protected_endpoint(ctx: SecurityContext = Depends(get_security_context)):
            return {"service": ctx.service_id}
    
    Raises:
        HTTPException 401: Token ausente o inválido
    """
    
    if not credentials:
        # Token ausente
        audit_logger.log_event(AuditEvent(
            event_type=AuditEventType.AUTH_TOKEN_INVALID,
            actor="unknown",
            action="authenticate",
            result="denied",
            severity=AuditSeverity.WARNING,
            details={"reason": "missing_token"}
        ))
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación requerido",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = credentials.credentials
    
    try:
        # Validar token
        payload = validate_service_token(token)
        
        # Extraer información
        service_id = payload.get("sub")
        role = payload.get("role")
        scopes = payload.get("scope", "").split()
        token_id = payload.get("jti")
        
        # Crear contexto
        ctx = SecurityContext(
            service_id=service_id,
            role=role,
            scopes=scopes,
            token_id=token_id
        )
        
        # Registrar validación exitosa
        audit_logger.log_token_validated(service_id, role, request.url.path)
        
        # Almacenar en request state para acceso posterior
        request.state.security_context = ctx
        
        return ctx
    
    except jwt.ExpiredSignatureError:
        audit_logger.log_event(AuditEvent(
            event_type=AuditEventType.AUTH_TOKEN_EXPIRED,
            actor="unknown",
            action="authenticate",
            result="denied",
            severity=AuditSeverity.WARNING,
            details={"reason": "token_expired"}
        ))
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado"
        )
    
    except jwt.InvalidTokenError as e:
        audit_logger.log_token_invalid("unknown", str(e), request.url.path)
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido: {str(e)}"
        )
    
    except Exception as e:
        logger.error(f"Error validando token: {e}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno de autenticación"
        )


def require_scopes(*required_scopes: str) -> Callable:
    """
    Decorator para requerir scopes específicos.
    
    Uso:
        @app.post("/execute")
        @require_scopes("execute:external", "read:approvals")
        async def execute_action(ctx: SecurityContext = Depends(get_security_context)):
            return {"status": "executed"}
    """
    
    def decorator(func: Callable) -> Callable:
        async def wrapper(*args, ctx: SecurityContext = Depends(get_security_context), **kwargs):
            # Verificar scopes
            missing_scopes = [s for s in required_scopes if not ctx.has_scope(s)]
            
            if missing_scopes:
                audit_logger.log_event(AuditEvent(
                    event_type=AuditEventType.AUTHZ_PERMISSION_DENIED,
                    actor=ctx.service_id,
                    action=func.__name__,
                    result="denied",
                    severity=AuditSeverity.WARNING,
                    details={
                        "required_scopes": list(required_scopes),
                        "missing_scopes": missing_scopes
                    }
                ))
                
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Scopes insuficientes. Faltan: {missing_scopes}"
                )
            
            return await func(*args, ctx=ctx, **kwargs)
        
        return wrapper
    
    return decorator


def require_permission(permission: Permission) -> Callable:
    """
    Decorator para requerir un permiso específico basado en IAM.
    
    Uso:
        @app.post("/execute")
        @require_permission(Permission.EXECUTE_EXTERNAL)
        async def execute_action(ctx: SecurityContext = Depends(get_security_context)):
            return {"status": "executed"}
    """
    
    def decorator(func: Callable) -> Callable:
        async def wrapper(*args, ctx: SecurityContext = Depends(get_security_context), **kwargs):
            # Verificar permiso
            has_permission = iam_enforcer.check_permission(ctx.role, permission)
            
            if not has_permission:
                audit_logger.log_permission_denied(
                    ctx.service_id,
                    permission.value,
                    func.__name__
                )
                
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permiso denegado: {permission.value}"
                )
            
            return await func(*args, ctx=ctx, **kwargs)
        
        return wrapper
    
    return decorator


class SecurityMiddleware:
    """
    Middleware global de seguridad para FastAPI.
    
    Valida tokens en todas las rutas (excepto las excluidas).
    
    Uso:
        from core.security.security_middleware import SecurityMiddleware
        
        middleware = SecurityMiddleware(
            exclude_paths=["/health", "/docs", "/openapi.json"]
        )
        app.middleware("http")(middleware)
    """
    
    def __init__(self, exclude_paths: Optional[List[str]] = None):
        self.exclude_paths = exclude_paths or ["/health", "/docs", "/openapi.json", "/redoc"]
    
    async def __call__(self, request: Request, call_next):
        """Procesa cada petición"""
        
        # Excluir rutas públicas
        if request.url.path in self.exclude_paths:
            return await call_next(request)
        
        # Validar autenticación
        try:
            ctx = await get_security_context(request)
            request.state.security_context = ctx
        except HTTPException as e:
            # Ya registrado por get_security_context
            return e
        
        # Continuar con la petición
        response = await call_next(request)
        
        # Agregar headers de seguridad
        response.headers["X-Security-Context"] = ctx.service_id
        
        return response


def create_security_middleware(service_name: str, exclude_paths: Optional[List[str]] = None):
    """
    Factory para crear middleware de seguridad.
    
    Args:
        service_name: Nombre del servicio (para logging)
        exclude_paths: Rutas a excluir de validación
    
    Returns:
        Instancia de SecurityMiddleware
    """
    logger.info(f"🔒 Configurando Security Middleware para '{service_name}'")
    
    return SecurityMiddleware(exclude_paths=exclude_paths)


# Helper para validación manual
def validate_request_token(request: Request, required_scopes: Optional[List[str]] = None) -> SecurityContext:
    """
    Valida manualmente el token de una petición.
    
    Uso:
        @app.post("/custom")
        async def custom_endpoint(request: Request):
            ctx = validate_request_token(request, required_scopes=["read:data"])
            return {"actor": ctx.service_id}
    """
    # Extraer token del header
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token ausente"
        )
    
    token = auth_header.split(" ")[1]
    
    try:
        payload = validate_service_token(token, required_scopes=required_scopes)
        
        return SecurityContext(
            service_id=payload.get("sub"),
            role=payload.get("role"),
            scopes=payload.get("scope", "").split(),
            token_id=payload.get("jti")
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido: {str(e)}"
        )
