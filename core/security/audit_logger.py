"""
Security Audit Logger
RFC-PHOENIX-03: Fase 3 - Auditoría de Seguridad

Registra todos los eventos de autenticación, autorización y acceso.
Envía eventos al bus de mensajería para procesamiento centralizado.
"""

import logging
import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum
import json

logger = logging.getLogger("AuditLogger")


class AuditEventType(str, Enum):
    """Tipos de eventos de auditoría"""
    
    # Autenticación
    AUTH_TOKEN_ISSUED = "auth.token.issued"
    AUTH_TOKEN_VALIDATED = "auth.token.validated"
    AUTH_TOKEN_EXPIRED = "auth.token.expired"
    AUTH_TOKEN_INVALID = "auth.token.invalid"
    
    # Autorización
    AUTHZ_PERMISSION_GRANTED = "authz.permission.granted"
    AUTHZ_PERMISSION_DENIED = "authz.permission.denied"
    AUTHZ_ACTION_ALLOWED = "authz.action.allowed"
    AUTHZ_ACTION_DENIED = "authz.action.denied"
    
    # mTLS
    MTLS_CERT_VALIDATED = "mtls.cert.validated"
    MTLS_CERT_INVALID = "mtls.cert.invalid"
    MTLS_CONNECTION_REJECTED = "mtls.connection.rejected"
    
    # Ejecución
    EXEC_ACTION_APPROVED = "exec.action.approved"
    EXEC_ACTION_EXECUTED = "exec.action.executed"
    EXEC_ACTION_FAILED = "exec.action.failed"
    
    # Administración
    ADMIN_POLICY_CHANGED = "admin.policy.changed"
    ADMIN_KEY_ROTATED = "admin.key.rotated"
    ADMIN_SECRET_ACCESSED = "admin.secret.accessed"


class AuditSeverity(str, Enum):
    """Severidad del evento de auditoría"""
    
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class AuditEvent:
    """Representa un evento de auditoría"""
    
    def __init__(
        self,
        event_type: AuditEventType,
        actor: str,  # Quien realiza la acción (servicio o usuario)
        action: str,  # Qué acción
        resource: Optional[str] = None,  # Sobre qué recurso
        target: Optional[str] = None,  # Servicio destino
        result: str = "success",  # success | denied | error
        severity: AuditSeverity = AuditSeverity.INFO,
        details: Optional[Dict[str, Any]] = None,
        trace_id: Optional[str] = None
    ):
        self.event_id = str(uuid.uuid4())
        self.timestamp = datetime.utcnow().isoformat()
        self.event_type = event_type.value
        self.actor = actor
        self.action = action
        self.resource = resource
        self.target = target
        self.result = result
        self.severity = severity.value
        self.details = details or {}
        self.trace_id = trace_id or str(uuid.uuid4())
    
    def to_dict(self) -> Dict[str, Any]:
        """Convierte el evento a diccionario"""
        return {
            "event_id": self.event_id,
            "timestamp": self.timestamp,
            "event_type": self.event_type,
            "actor": self.actor,
            "action": self.action,
            "resource": self.resource,
            "target": self.target,
            "result": self.result,
            "severity": self.severity,
            "details": self.details,
            "trace_id": self.trace_id
        }
    
    def to_json(self) -> str:
        """Convierte el evento a JSON"""
        return json.dumps(self.to_dict(), indent=2)


class SecurityAuditLogger:
    """
    Logger centralizado de eventos de seguridad.
    
    Registra eventos localmente y los envía al bus de eventos
    para procesamiento centralizado.
    """
    
    def __init__(self):
        self.event_bus = None
        self._local_log_enabled = True
        self._event_bus_enabled = False
        
        # Intentar conectar con el Event Bus (si existe)
        try:
            from core.event_bus import EventBus
            self.event_bus = EventBus()
            self._event_bus_enabled = True
            logger.info("✅ Audit Logger conectado al Event Bus")
        except ImportError:
            logger.warning("⚠️  Event Bus no disponible. Solo logging local.")
    
    def log_event(self, event: AuditEvent):
        """
        Registra un evento de auditoría.
        
        Args:
            event: Instancia de AuditEvent
        """
        # Log local
        if self._local_log_enabled:
            log_msg = (
                f"[AUDIT] {event.event_type} | "
                f"actor={event.actor} | "
                f"action={event.action} | "
                f"result={event.result}"
            )
            
            if event.severity == AuditSeverity.CRITICAL.value:
                logger.critical(log_msg)
            elif event.severity == AuditSeverity.ERROR.value:
                logger.error(log_msg)
            elif event.severity == AuditSeverity.WARNING.value:
                logger.warning(log_msg)
            else:
                logger.info(log_msg)
        
        # Enviar al Event Bus
        if self._event_bus_enabled and self.event_bus:
            try:
                self.event_bus.publish_sync(
                    topic="security.audit",
                    event=event.to_dict()
                )
            except Exception as e:
                logger.error(f"Error enviando evento al bus: {e}")
    
    # --- Helpers para eventos comunes ---
    
    def log_token_issued(self, service_id: str, role: str, scopes: list, token_id: str):
        """Registra emisión de token"""
        event = AuditEvent(
            event_type=AuditEventType.AUTH_TOKEN_ISSUED,
            actor="sts",
            action="issue_token",
            target=service_id,
            result="success",
            severity=AuditSeverity.INFO,
            details={
                "role": role,
                "scopes": scopes,
                "token_id": token_id
            }
        )
        self.log_event(event)
    
    def log_token_validated(self, service_id: str, role: str, validator: str):
        """Registra validación exitosa de token"""
        event = AuditEvent(
            event_type=AuditEventType.AUTH_TOKEN_VALIDATED,
            actor=service_id,
            action="validate_token",
            target=validator,
            result="success",
            severity=AuditSeverity.INFO,
            details={"role": role}
        )
        self.log_event(event)
    
    def log_token_invalid(self, service_id: str, reason: str, validator: str):
        """Registra intento con token inválido"""
        event = AuditEvent(
            event_type=AuditEventType.AUTH_TOKEN_INVALID,
            actor=service_id,
            action="validate_token",
            target=validator,
            result="denied",
            severity=AuditSeverity.WARNING,
            details={"reason": reason}
        )
        self.log_event(event)
    
    def log_permission_denied(
        self,
        service_id: str,
        permission: str,
        resource: Optional[str] = None
    ):
        """Registra denegación de permiso"""
        event = AuditEvent(
            event_type=AuditEventType.AUTHZ_PERMISSION_DENIED,
            actor=service_id,
            action="check_permission",
            resource=resource,
            result="denied",
            severity=AuditSeverity.WARNING,
            details={"permission": permission}
        )
        self.log_event(event)
    
    def log_action_denied(
        self,
        service_id: str,
        action: str,
        target: str,
        reason: str
    ):
        """Registra acción denegada"""
        event = AuditEvent(
            event_type=AuditEventType.AUTHZ_ACTION_DENIED,
            actor=service_id,
            action=action,
            target=target,
            result="denied",
            severity=AuditSeverity.WARNING,
            details={"reason": reason}
        )
        self.log_event(event)
    
    def log_action_executed(
        self,
        service_id: str,
        action: str,
        target: str,
        details: Optional[Dict] = None
    ):
        """Registra ejecución de acción"""
        event = AuditEvent(
            event_type=AuditEventType.EXEC_ACTION_EXECUTED,
            actor=service_id,
            action=action,
            target=target,
            result="success",
            severity=AuditSeverity.INFO,
            details=details
        )
        self.log_event(event)
    
    def log_mtls_validation(self, client_cn: str, server: str, success: bool):
        """Registra validación de certificado mTLS"""
        event = AuditEvent(
            event_type=AuditEventType.MTLS_CERT_VALIDATED if success else AuditEventType.MTLS_CERT_INVALID,
            actor=client_cn,
            action="mtls_validate",
            target=server,
            result="success" if success else "denied",
            severity=AuditSeverity.INFO if success else AuditSeverity.WARNING
        )
        self.log_event(event)
    
    def log_key_rotation(self, old_key_id: str, new_key_id: str):
        """Registra rotación de claves"""
        event = AuditEvent(
            event_type=AuditEventType.ADMIN_KEY_ROTATED,
            actor="sts",
            action="rotate_keys",
            result="success",
            severity=AuditSeverity.WARNING,
            details={
                "old_key_id": old_key_id,
                "new_key_id": new_key_id
            }
        )
        self.log_event(event)
    
    def log_secret_access(self, service_id: str, secret_key: str, success: bool):
        """Registra acceso a secretos"""
        event = AuditEvent(
            event_type=AuditEventType.ADMIN_SECRET_ACCESSED,
            actor=service_id,
            action="get_secret",
            resource=secret_key,
            result="success" if success else "error",
            severity=AuditSeverity.INFO,
            details={"secret_key": secret_key}
        )
        self.log_event(event)


# Singleton global
audit_logger = SecurityAuditLogger()


# Helper functions
def log_audit_event(event: AuditEvent):
    """Función helper para registrar eventos"""
    audit_logger.log_event(event)


def log_token_issued(service_id: str, role: str, scopes: list, token_id: str):
    """Helper para emisión de token"""
    audit_logger.log_token_issued(service_id, role, scopes, token_id)


def log_permission_denied(service_id: str, permission: str, resource: Optional[str] = None):
    """Helper para denegación de permiso"""
    audit_logger.log_permission_denied(service_id, permission, resource)


def log_action_denied(service_id: str, action: str, target: str, reason: str):
    """Helper para acción denegada"""
    audit_logger.log_action_denied(service_id, action, target, reason)
