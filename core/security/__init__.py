"""
Core Security Module
RFC-PHOENIX-03: Fase 3 - Seguridad, IAM y Gestión de Secretos

Exportaciones centrales del módulo de seguridad.
"""

# Secret Management
from .secrets import (
    SecretManager,
    SecretProvider,
    LocalSecretProvider,
    VaultSecretProvider,
    KMSSecretProvider,
    secret_manager,
    get_secret,
    require_secret
)

# Security Token Service
from .sts import (
    SecurityTokenService,
    TokenClaims,
    SigningKey,
    sts_service,
    issue_service_token,
    validate_service_token
)

# mTLS Configuration
from .mtls_config import (
    MTLSConfig,
    MTLSMiddleware,
    get_mtls_config,
    configure_uvicorn_ssl
)

# IAM / RBAC
from .iam_policy import (
    IamPolicyEnforcer,
    Permission,
    ServiceRole,
    UserRole,
    RoleDefinition,
    PolicyRule,
    iam_enforcer,
    check_permission,
    check_action,
    require_permission
)

# Audit Logging
from .audit_logger import (
    SecurityAuditLogger,
    AuditEvent,
    AuditEventType,
    AuditSeverity,
    audit_logger,
    log_audit_event,
    log_token_issued,
    log_permission_denied,
    log_action_denied
)

# Security Middleware
from .security_middleware import (
    SecurityContext,
    SecurityMiddleware,
    get_security_context,
    require_scopes,
    require_permission as require_permission_decorator,
    create_security_middleware,
    validate_request_token
)

# Secure HTTP Client
from .secure_client import (
    SecureServiceClient,
    create_secure_client
)

__all__ = [
    # Secret Management
    "SecretManager",
    "SecretProvider",
    "LocalSecretProvider",
    "VaultSecretProvider",
    "KMSSecretProvider",
    "secret_manager",
    "get_secret",
    "require_secret",
    
    # STS
    "SecurityTokenService",
    "TokenClaims",
    "SigningKey",
    "sts_service",
    "issue_service_token",
    "validate_service_token",
    
    # mTLS
    "MTLSConfig",
    "MTLSMiddleware",
    "get_mtls_config",
    "configure_uvicorn_ssl",
    
    # IAM
    "IamPolicyEnforcer",
    "Permission",
    "ServiceRole",
    "UserRole",
    "RoleDefinition",
    "PolicyRule",
    "iam_enforcer",
    "check_permission",
    "check_action",
    "require_permission",
    
    # Audit
    "SecurityAuditLogger",
    "AuditEvent",
    "AuditEventType",
    "AuditSeverity",
    "audit_logger",
    "log_audit_event",
    "log_token_issued",
    "log_permission_denied",
    "log_action_denied",
    
    # Middleware
    "SecurityContext",
    "SecurityMiddleware",
    "get_security_context",
    "require_scopes",
    "require_permission_decorator",
    "create_security_middleware",
    "validate_request_token",
    
    # Secure Client
    "SecureServiceClient",
    "create_secure_client"
]

__version__ = "3.0.0"
__author__ = "LeadBoostAI Security Team"
__description__ = "Enterprise Security Infrastructure - RFC-PHOENIX-03"
