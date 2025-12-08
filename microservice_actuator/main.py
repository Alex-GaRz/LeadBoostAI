import logging
import uuid
import uvicorn
from fastapi import FastAPI, Depends
from pydantic import BaseModel
from typing import Dict, Any
from dotenv import load_dotenv
import os

# Cargar .env
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', '.env'))

from microservice_actuator.handlers.marketing_handler import MarketingHandler
from microservice_actuator.models.schemas import ActionRequest
# Nuevas importaciones para Inyección de Dependencias
from microservice_actuator.core.memory_client import MemoryClient
from microservice_actuator.core.creative_factory import CreativeFactory

# Security Modules (RFC-PHOENIX-03)
from core.security import (
    secret_manager,
    get_security_context,
    SecurityContext,
    require_permission,
    Permission,
    create_security_middleware,
    get_mtls_config,
    configure_uvicorn_ssl,
    audit_logger
)

app = FastAPI(
    title="Block 7: Actuator Engine - Reality Factory (Secure)",
    version="3.0.0"
)

# Security Middleware
security_middleware = create_security_middleware(
    service_name="actuator",
    exclude_paths=["/health", "/docs", "/openapi.json"]
)
app.middleware("http")(security_middleware)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ActuatorAPI")

# --- COMPOSITION ROOT ---
# Inicializamos el cliente de memoria (Singleton en la app)
memory_client = MemoryClient()

# Inicializamos la Fábrica Creativa con el cliente de memoria
creative_factory = CreativeFactory(memory_client=memory_client)

# Inicializamos el Handler inyectando la fábrica personalizada
# (Asumimos que MarketingHandler acepta creative_factory en init o lo seteamos manualmente)
marketing_handler = MarketingHandler()
# Monkey-patching o inyección por setter si el Handler no lo soporta en __init__
# Idealmente MarketingHandler.__init__ debería aceptar la fábrica.
# Para este ejercicio, asumimos que asignamos la instancia:
marketing_handler.creative_factory = creative_factory

class WebProposal(BaseModel):
    action_type: str 
    parameters: Dict[str, Any]
    reasoning: str = "Direct command"

@app.post("/actuate")
async def execute_action(
    proposal: WebProposal,
    ctx: SecurityContext = Depends(get_security_context)
):
    """
    Ejecuta una acción externa SOLO si:
    1. El token es válido
    2. El servicio tiene permiso EXECUTE_EXTERNAL
    3. La petición viene de Enterprise (con aprobación)
    
    RFC-PHOENIX-03: Zero Trust Enforcement
    """
    logger.info(f"🔔 Solicitud de actuación recibida: {proposal.action_type}")
    logger.info(f"🔐 Actor: {ctx.service_id} (role: {ctx.role})")
    
    # Validar permiso
    from core.security import iam_enforcer
    
    has_permission = iam_enforcer.check_permission(
        ctx.role,
        Permission.EXECUTE_EXTERNAL
    )
    
    if not has_permission:
        audit_logger.log_action_denied(
            service_id=ctx.service_id,
            action="execute_external",
            target="actuator",
            reason="Insufficient permissions"
        )
        
        return {
            "status": "DENIED",
            "reason": "Service does not have EXECUTE_EXTERNAL permission"
        }
    
    # Validar que viene de Enterprise (opcional pero recomendado)
    if ctx.service_id != "svc.enterprise":
        logger.warning(f"⚠️  Ejecución solicitada por servicio no autorizado: {ctx.service_id}")
        # En modo estricto, rechazar. En modo permisivo, permitir pero auditar.
    
    action_id = str(uuid.uuid4())

    
    action_req = ActionRequest(
        action_id=action_id,
        action_type=proposal.action_type,
        priority="HIGH",
        reasoning=proposal.reasoning,
        parameters=proposal.parameters
    )

    # El handler llamará a creative_factory.generate_asset, que ahora usa RAG
    result = await marketing_handler.execute(action_req)
    
    # Registrar ejecución en auditoría
    audit_logger.log_action_executed(
        service_id=ctx.service_id,
        action="execute_external",
        target=proposal.action_type,
        details={
            "action_id": action_id,
            "action_type": proposal.action_type
        }
    )
    
    return result

@app.get("/health")
def health_check():
    return {
        "status": "online", 
        "mode": "REALITY_FACTORY_V3_SECURE",
        "security": "RFC-PHOENIX-03"
    }

if __name__ == "__main__":
    import uvicorn
    
    # Configuración mTLS
    mtls_config = get_mtls_config("actuator")
    ssl_params = configure_uvicorn_ssl(mtls_config)
    
    logger.info("🚀 Starting Actuator Engine (Secure Mode)")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8002,
        **ssl_params
    )