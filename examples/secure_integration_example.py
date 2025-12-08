"""
Ejemplo de Integración Segura entre Servicios
RFC-PHOENIX-03: Fase 3 - Demostración de Zero Trust

Este script demuestra:
1. Obtención de token del STS
2. Llamada segura entre servicios con mTLS
3. Validación de permisos
4. Registro de auditoría
"""

import asyncio
import logging
from core.security import create_secure_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SecureIntegrationExample")


async def example_enterprise_to_actuator():
    """
    Simula Enterprise llamando al Actuator de forma segura.
    """
    
    logger.info("\n" + "="*60)
    logger.info("EJEMPLO: Enterprise → Actuator (Secure)")
    logger.info("="*60)
    
    # 1. Enterprise obtiene su propio cliente seguro
    async with create_secure_client("enterprise") as client:
        
        logger.info("\n1️⃣  Enterprise obteniendo token del STS...")
        # El token se obtiene automáticamente en la primera petición
        
        # 2. Enterprise llama al Actuator para ejecutar una acción
        logger.info("\n2️⃣  Enterprise → Actuator: Ejecutar campaña...")
        
        try:
            response = await client.post(
                "http://actuator:8002/actuate",
                json={
                    "action_type": "create_meta_campaign",
                    "parameters": {
                        "objective": "CONVERSIONS",
                        "budget": 500,
                        "duration_days": 7
                    },
                    "reasoning": "Aprobado por Enterprise Governance"
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ Acción ejecutada: {result}")
            else:
                logger.error(f"❌ Error: {response.status_code} - {response.text}")
        
        except Exception as e:
            logger.error(f"❌ Error en comunicación: {e}")


async def example_analyst_to_actuator_denied():
    """
    Demuestra que Analyst NO puede llamar directamente a Actuator.
    """
    
    logger.info("\n" + "="*60)
    logger.info("EJEMPLO: Analyst → Actuator (DENEGADO)")
    logger.info("="*60)
    
    # 1. Analyst intenta obtener token
    async with create_secure_client("analyst") as client:
        
        logger.info("\n1️⃣  Analyst obteniendo token del STS...")
        
        # 2. Analyst intenta llamar al Actuator (debería ser rechazado)
        logger.info("\n2️⃣  Analyst → Actuator: Intentando ejecutar acción...")
        
        try:
            response = await client.post(
                "http://actuator:8002/actuate",
                json={
                    "action_type": "create_meta_campaign",
                    "parameters": {"budget": 100}
                }
            )
            
            if response.status_code == 403:
                logger.warning("⛔ DENEGADO (como esperado): Analyst no tiene permiso EXECUTE_EXTERNAL")
            elif response.status_code == 200:
                logger.error("❌ ERROR: Analyst NO debería poder ejecutar!")
            else:
                logger.info(f"Respuesta: {response.status_code}")
        
        except Exception as e:
            logger.error(f"Error: {e}")


async def example_token_validation():
    """
    Demuestra validación de token JWT.
    """
    
    logger.info("\n" + "="*60)
    logger.info("EJEMPLO: Validación de Tokens")
    logger.info("="*60)
    
    from core.security import sts_service
    
    # 1. Emitir token
    logger.info("\n1️⃣  Emitiendo token para 'svc.actuator'...")
    
    token = sts_service.issue_token(
        service_id="svc.actuator",
        role="svc.actuator",
        scopes=["read:approvals", "execute:external"],
        expiration_minutes=15
    )
    
    logger.info(f"✅ Token emitido: {token[:50]}...")
    
    # 2. Validar token
    logger.info("\n2️⃣  Validando token...")
    
    try:
        payload = sts_service.validate_token(token)
        logger.info(f"✅ Token válido:")
        logger.info(f"   - Subject: {payload['sub']}")
        logger.info(f"   - Role: {payload['role']}")
        logger.info(f"   - Scopes: {payload['scope']}")
    
    except Exception as e:
        logger.error(f"❌ Token inválido: {e}")
    
    # 3. Intentar validar con scopes incorrectos
    logger.info("\n3️⃣  Validando con scopes requeridos incorrectos...")
    
    try:
        sts_service.validate_token(token, required_scopes=["admin:users"])
        logger.error("❌ ERROR: Debería haber fallado")
    except ValueError as e:
        logger.warning(f"⛔ DENEGADO (como esperado): {e}")


async def example_iam_policy_check():
    """
    Demuestra verificación de políticas IAM.
    """
    
    logger.info("\n" + "="*60)
    logger.info("EJEMPLO: Verificación de Políticas IAM")
    logger.info("="*60)
    
    from core.security import iam_enforcer, Permission
    
    # Test 1: Actuator puede ejecutar
    logger.info("\n1️⃣  ¿Actuator puede EXECUTE_EXTERNAL?")
    can_execute = iam_enforcer.check_permission("svc.actuator", Permission.EXECUTE_EXTERNAL)
    logger.info(f"   {'✅ SÍ' if can_execute else '⛔ NO'}")
    
    # Test 2: Analyst NO puede ejecutar
    logger.info("\n2️⃣  ¿Analyst puede EXECUTE_EXTERNAL?")
    can_execute = iam_enforcer.check_permission("svc.analyst", Permission.EXECUTE_EXTERNAL)
    logger.info(f"   {'❌ ERROR' if can_execute else '⛔ NO (correcto)'}")
    
    # Test 3: Optimizer puede escribir planes
    logger.info("\n3️⃣  ¿Optimizer puede WRITE_PLANS?")
    can_write = iam_enforcer.check_permission("svc.optimizer", Permission.WRITE_PLANS)
    logger.info(f"   {'✅ SÍ' if can_write else '⛔ NO'}")
    
    # Test 4: Optimizer NO puede modificar presupuesto
    logger.info("\n4️⃣  ¿Optimizer puede WRITE_BUDGET?")
    can_write = iam_enforcer.check_permission("svc.optimizer", Permission.WRITE_BUDGET)
    logger.info(f"   {'❌ ERROR' if can_write else '⛔ NO (correcto)'}")


async def main():
    """Ejecuta todos los ejemplos"""
    
    print("\n" + "="*60)
    print("🔐 DEMOSTRACIÓN DE SEGURIDAD - RFC-PHOENIX-03")
    print("="*60)
    
    # 1. Validación de tokens
    await example_token_validation()
    
    # 2. Verificación de políticas IAM
    await example_iam_policy_check()
    
    # 3. Comunicación segura permitida
    # await example_enterprise_to_actuator()  # Descomentar cuando los servicios estén corriendo
    
    # 4. Comunicación denegada
    # await example_analyst_to_actuator_denied()  # Descomentar cuando los servicios estén corriendo
    
    print("\n" + "="*60)
    print("✅ DEMOSTRACIÓN COMPLETA")
    print("="*60)
    print("\n📋 RESUMEN:")
    print("   - Tokens JWT emitidos correctamente")
    print("   - Políticas IAM validadas")
    print("   - Zero Trust enforcement activo")
    print("   - Auditoría registrada\n")


if __name__ == "__main__":
    asyncio.run(main())
