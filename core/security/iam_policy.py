"""
Identity and Access Management (IAM) / Role-Based Access Control (RBAC)
RFC-PHOENIX-03: Fase 3 - Control de Acceso

Define roles, permisos y políticas de acceso entre servicios.
Implementa el principio de Zero Trust.
"""

import logging
from typing import Dict, List, Set, Optional
from dataclasses import dataclass
from enum import Enum
import yaml
from pathlib import Path

logger = logging.getLogger("IAM")


class Permission(str, Enum):
    """Permisos granulares del sistema"""
    
    # Lectura
    READ_SIGNALS = "read:signals"
    READ_INSIGHTS = "read:insights"
    READ_PLANS = "read:plans"
    READ_APPROVALS = "read:approvals"
    READ_CONTEXT = "read:context"
    READ_RULES = "read:rules"
    READ_BUDGET = "read:budget"
    
    # Escritura
    WRITE_INSIGHTS = "write:insights"
    WRITE_PLANS = "write:plans"
    WRITE_APPROVALS = "write:approvals"
    WRITE_CONTEXT = "write:context"
    WRITE_RULES = "write:rules"
    WRITE_BUDGET = "write:budget"
    
    # Ejecución
    EXECUTE_EXTERNAL = "execute:external"
    EXECUTE_ANALYSIS = "execute:analysis"
    EXECUTE_OPTIMIZATION = "execute:optimization"
    
    # Administración
    ADMIN_USERS = "admin:users"
    ADMIN_POLICIES = "admin:policies"
    ADMIN_AUDIT = "admin:audit"
    
    # Proxy
    PROXY_ALL = "proxy:all"


class ServiceRole(str, Enum):
    """Roles de servicios (Service Accounts)"""
    
    ANALYST = "svc.analyst"
    OPTIMIZER = "svc.optimizer"
    ENTERPRISE = "svc.enterprise"
    ACTUATOR = "svc.actuator"
    MEMORY = "svc.memory"
    BFF = "svc.bff"
    SCOUT = "svc.scout"


class UserRole(str, Enum):
    """Roles de usuarios humanos"""
    
    ADMIN = "user.admin"
    MANAGER = "user.manager"
    VIEWER = "user.viewer"
    OPERATOR = "user.operator"


@dataclass
class PolicyRule:
    """Regla de política de acceso"""
    
    resource: str  # Recurso al que aplica (ej: "actuator:execute")
    action: str    # Acción (ej: "POST", "execute")
    effect: str    # "allow" o "deny"
    conditions: Optional[Dict] = None  # Condiciones adicionales


@dataclass
class RoleDefinition:
    """Definición completa de un rol"""
    
    role_id: str
    role_name: str
    description: str
    permissions: Set[Permission]
    policies: List[PolicyRule]
    
    def has_permission(self, permission: Permission) -> bool:
        """Verifica si el rol tiene un permiso específico"""
        return permission in self.permissions
    
    def has_any_permission(self, permissions: List[Permission]) -> bool:
        """Verifica si el rol tiene al menos uno de los permisos"""
        return any(p in self.permissions for p in permissions)
    
    def has_all_permissions(self, permissions: List[Permission]) -> bool:
        """Verifica si el rol tiene todos los permisos"""
        return all(p in self.permissions for p in permissions)


class IamPolicyEnforcer:
    """
    Motor de evaluación de políticas IAM.
    
    Valida si un actor (servicio o usuario) tiene permisos para realizar
    una acción sobre un recurso.
    """
    
    def __init__(self, config_path: Optional[str] = None):
        self.roles: Dict[str, RoleDefinition] = {}
        
        if config_path is None:
            config_path = Path(__file__).parent.parent.parent / "config" / "security" / "iam_policies.yaml"
        
        self.config_path = Path(config_path)
        self._load_policies()
    
    def _load_policies(self):
        """Carga las políticas desde archivo YAML"""
        
        if not self.config_path.exists():
            logger.warning(f"⚠️  Políticas IAM no encontradas: {self.config_path}")
            self._load_default_policies()
            return
        
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
            
            # Parsear roles
            for role_data in config.get("roles", []):
                role = self._parse_role(role_data)
                self.roles[role.role_id] = role
                logger.debug(f"Rol cargado: {role.role_id} ({len(role.permissions)} permisos)")
            
            logger.info(f"✅ Políticas IAM cargadas: {len(self.roles)} roles")
        
        except Exception as e:
            logger.error(f"❌ Error cargando políticas IAM: {e}")
            self._load_default_policies()
    
    def _parse_role(self, role_data: Dict) -> RoleDefinition:
        """Parsea un rol desde YAML"""
        
        permissions = set()
        for perm_str in role_data.get("permissions", []):
            try:
                permissions.add(Permission(perm_str))
            except ValueError:
                logger.warning(f"Permiso desconocido: {perm_str}")
        
        policies = []
        for policy_data in role_data.get("policies", []):
            policies.append(PolicyRule(
                resource=policy_data.get("resource", "*"),
                action=policy_data.get("action", "*"),
                effect=policy_data.get("effect", "allow"),
                conditions=policy_data.get("conditions")
            ))
        
        return RoleDefinition(
            role_id=role_data["role_id"],
            role_name=role_data.get("role_name", role_data["role_id"]),
            description=role_data.get("description", ""),
            permissions=permissions,
            policies=policies
        )
    
    def _load_default_policies(self):
        """Carga políticas por defecto según RFC-PHOENIX-03"""
        
        logger.info("📋 Cargando políticas IAM por defecto...")
        
        # ANALYST: Solo lectura de señales, escritura de insights
        self.roles[ServiceRole.ANALYST] = RoleDefinition(
            role_id=ServiceRole.ANALYST,
            role_name="Analyst Service",
            description="Analiza señales del mercado y genera insights",
            permissions={
                Permission.READ_SIGNALS,
                Permission.WRITE_INSIGHTS,
                Permission.EXECUTE_ANALYSIS
            },
            policies=[
                PolicyRule("signals", "read", "allow"),
                PolicyRule("insights", "write", "allow"),
                PolicyRule("actions", "execute", "deny"),  # No puede ejecutar
                PolicyRule("rules", "write", "deny")       # No puede modificar reglas
            ]
        )
        
        # OPTIMIZER: Lee insights, escribe planes
        self.roles[ServiceRole.OPTIMIZER] = RoleDefinition(
            role_id=ServiceRole.OPTIMIZER,
            role_name="Optimizer Service",
            description="Optimiza estrategias y genera planes",
            permissions={
                Permission.READ_INSIGHTS,
                Permission.WRITE_PLANS,
                Permission.READ_BUDGET,
                Permission.EXECUTE_OPTIMIZATION
            },
            policies=[
                PolicyRule("insights", "read", "allow"),
                PolicyRule("plans", "write", "allow"),
                PolicyRule("actions", "execute", "deny"),  # No puede ejecutar
                PolicyRule("budget", "write", "deny")      # No puede modificar presupuesto
            ]
        )
        
        # ENTERPRISE: Control central, aprueba todo
        self.roles[ServiceRole.ENTERPRISE] = RoleDefinition(
            role_id=ServiceRole.ENTERPRISE,
            role_name="Enterprise Nervous System",
            description="Sistema central de gobernanza y aprobación",
            permissions={
                Permission.READ_PLANS,
                Permission.WRITE_APPROVALS,
                Permission.WRITE_RULES,
                Permission.READ_BUDGET,
                Permission.WRITE_BUDGET
            },
            policies=[
                PolicyRule("plans", "read", "allow"),
                PolicyRule("approvals", "write", "allow"),
                PolicyRule("rules", "write", "allow"),
                PolicyRule("actions", "execute", "deny")  # No ejecuta directamente
            ]
        )
        
        # ACTUATOR: Solo ejecuta con aprobación
        self.roles[ServiceRole.ACTUATOR] = RoleDefinition(
            role_id=ServiceRole.ACTUATOR,
            role_name="Actuator Engine",
            description="Ejecuta acciones externas aprobadas",
            permissions={
                Permission.READ_APPROVALS,
                Permission.EXECUTE_EXTERNAL
            },
            policies=[
                PolicyRule("approvals", "read", "allow"),
                PolicyRule("external", "execute", "allow", 
                          conditions={"requires": "approval_token"})
            ]
        )
        
        # MEMORY: Acceso exclusivo a vectores
        self.roles[ServiceRole.MEMORY] = RoleDefinition(
            role_id=ServiceRole.MEMORY,
            role_name="Memory Service",
            description="Gestión de contexto y memoria vectorial",
            permissions={
                Permission.READ_CONTEXT,
                Permission.WRITE_CONTEXT
            },
            policies=[
                PolicyRule("context", "*", "allow"),
                PolicyRule("actions", "execute", "deny")
            ]
        )
        
        # BFF: Proxy sin permisos de ejecución directa
        self.roles[ServiceRole.BFF] = RoleDefinition(
            role_id=ServiceRole.BFF,
            role_name="Backend for Frontend",
            description="API Gateway para clientes web",
            permissions={
                Permission.PROXY_ALL
            },
            policies=[
                PolicyRule("*", "proxy", "allow"),
                PolicyRule("*", "execute", "deny")  # Solo retransmite
            ]
        )
        
        # ADMIN (usuario)
        self.roles[UserRole.ADMIN] = RoleDefinition(
            role_id=UserRole.ADMIN,
            role_name="Administrator",
            description="Administrador del sistema",
            permissions={
                Permission.ADMIN_USERS,
                Permission.ADMIN_POLICIES,
                Permission.ADMIN_AUDIT,
                Permission.READ_BUDGET,
                Permission.WRITE_BUDGET
            },
            policies=[
                PolicyRule("*", "*", "allow")
            ]
        )
        
        logger.info(f"✅ {len(self.roles)} roles por defecto cargados")
    
    def get_role(self, role_id: str) -> Optional[RoleDefinition]:
        """Obtiene la definición de un rol"""
        return self.roles.get(role_id)
    
    def check_permission(
        self,
        role_id: str,
        permission: Permission,
        resource: Optional[str] = None
    ) -> bool:
        """
        Verifica si un rol tiene un permiso específico.
        
        Args:
            role_id: ID del rol (ej: "svc.actuator")
            permission: Permiso a verificar
            resource: Recurso opcional para políticas contextuales
        
        Returns:
            True si tiene el permiso, False si no
        """
        role = self.get_role(role_id)
        
        if not role:
            logger.warning(f"⚠️  Rol desconocido: {role_id}")
            return False
        
        has_permission = role.has_permission(permission)
        
        if has_permission:
            logger.debug(f"✅ {role_id} tiene permiso: {permission.value}")
        else:
            logger.warning(f"⛔ {role_id} NO tiene permiso: {permission.value}")
        
        return has_permission
    
    def check_action(
        self,
        role_id: str,
        resource: str,
        action: str,
        context: Optional[Dict] = None
    ) -> bool:
        """
        Verifica si un rol puede realizar una acción sobre un recurso.
        
        Args:
            role_id: ID del rol
            resource: Recurso (ej: "actuator:execute")
            action: Acción (ej: "POST", "execute")
            context: Contexto adicional para evaluación de condiciones
        
        Returns:
            True si la acción está permitida, False si no
        """
        role = self.get_role(role_id)
        
        if not role:
            return False
        
        # Evaluar políticas
        for policy in role.policies:
            if self._match_policy(policy, resource, action, context):
                if policy.effect == "deny":
                    logger.warning(f"⛔ {role_id} DENEGADO: {action} en {resource}")
                    return False
                elif policy.effect == "allow":
                    logger.debug(f"✅ {role_id} PERMITIDO: {action} en {resource}")
                    return True
        
        # Default deny
        logger.warning(f"⛔ {role_id} denegado por defecto: {action} en {resource}")
        return False
    
    def _match_policy(
        self,
        policy: PolicyRule,
        resource: str,
        action: str,
        context: Optional[Dict]
    ) -> bool:
        """Evalúa si una política aplica a la solicitud"""
        
        # Match de recurso (* o exacto)
        if policy.resource != "*" and policy.resource != resource:
            return False
        
        # Match de acción (* o exacto)
        if policy.action != "*" and policy.action != action:
            return False
        
        # Evaluar condiciones
        if policy.conditions and context:
            for key, value in policy.conditions.items():
                if context.get(key) != value:
                    return False
        
        return True
    
    def reload_policies(self):
        """Recarga las políticas desde el archivo"""
        self.roles.clear()
        self._load_policies()


# Singleton global
iam_enforcer = IamPolicyEnforcer()


# Helper functions
def check_permission(role_id: str, permission: Permission) -> bool:
    """Función helper para verificar permisos"""
    return iam_enforcer.check_permission(role_id, permission)


def check_action(role_id: str, resource: str, action: str, context: Optional[Dict] = None) -> bool:
    """Función helper para verificar acciones"""
    return iam_enforcer.check_action(role_id, resource, action, context)


def require_permission(role_id: str, permission: Permission):
    """
    Valida permiso y lanza excepción si no lo tiene.
    
    Raises:
        PermissionError: Si el rol no tiene el permiso
    """
    if not check_permission(role_id, permission):
        raise PermissionError(f"Rol '{role_id}' no tiene permiso: {permission.value}")
