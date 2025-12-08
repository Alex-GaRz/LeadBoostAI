#!/usr/bin/env python3
"""
Validation Script - Fase 3
Verifica que todos los componentes de seguridad estén correctamente instalados
"""

import sys
from pathlib import Path

# Colores para output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'

def check_ok(msg):
    print(f"{GREEN}✅ {msg}{RESET}")

def check_error(msg):
    print(f"{RED}❌ {msg}{RESET}")

def check_warning(msg):
    print(f"{YELLOW}⚠️  {msg}{RESET}")

def validate_dependencies():
    """Valida que las dependencias de Python estén instaladas"""
    print("\n[1/6] Validando dependencias de Python...")
    
    required = [
        ("jwt", "PyJWT"),
        ("cryptography", "cryptography"),
        ("httpx", "httpx"),
        ("yaml", "PyYAML"),
        ("fastapi", "FastAPI"),
        ("pydantic", "Pydantic")
    ]
    
    missing = []
    for module, package in required:
        try:
            __import__(module)
            check_ok(f"{package} instalado")
        except ImportError:
            check_error(f"{package} NO instalado")
            missing.append(package)
    
    if missing:
        check_error(f"Dependencias faltantes: {', '.join(missing)}")
        return False
    
    return True

def validate_security_module():
    """Valida que el módulo de seguridad esté correctamente estructurado"""
    print("\n[2/6] Validando módulo de seguridad...")
    
    try:
        from core.security import (
            secret_manager,
            sts_service,
            iam_enforcer,
            audit_logger,
            create_secure_client,
            get_security_context
        )
        check_ok("Módulo core.security importado correctamente")
        check_ok("secret_manager disponible")
        check_ok("sts_service disponible")
        check_ok("iam_enforcer disponible")
        check_ok("audit_logger disponible")
        check_ok("create_secure_client disponible")
        check_ok("get_security_context disponible")
        return True
    except ImportError as e:
        check_error(f"Error importando core.security: {e}")
        return False

def validate_config_files():
    """Valida que los archivos de configuración existan"""
    print("\n[3/6] Validando archivos de configuración...")
    
    base_dir = Path(__file__).parent
    
    required_files = [
        "config/security/iam_policies.yaml",
        "config/security/service_identities.yaml",
        ".env.security.example"
    ]
    
    all_exist = True
    for file_path in required_files:
        full_path = base_dir / file_path
        if full_path.exists():
            check_ok(f"{file_path} existe")
        else:
            check_error(f"{file_path} NO existe")
            all_exist = False
    
    return all_exist

def validate_scripts():
    """Valida que los scripts necesarios existan"""
    print("\n[4/6] Validando scripts...")
    
    base_dir = Path(__file__).parent
    
    scripts = [
        "scripts/generate_certificates.py",
        "examples/secure_integration_example.py",
        "init_security.bat"
    ]
    
    all_exist = True
    for script in scripts:
        full_path = base_dir / script
        if full_path.exists():
            check_ok(f"{script} existe")
        else:
            check_error(f"{script} NO existe")
            all_exist = False
    
    return all_exist

def validate_sts():
    """Valida que el STS funcione correctamente"""
    print("\n[5/6] Validando Security Token Service...")
    
    try:
        from core.security import sts_service, Permission
        
        # Emitir token de prueba
        token = sts_service.issue_token(
            service_id="svc.test",
            role="svc.test",
            scopes=["test:scope"],
            expiration_minutes=1
        )
        check_ok("Token de prueba emitido correctamente")
        
        # Validar token
        payload = sts_service.validate_token(token)
        if payload["sub"] == "svc.test":
            check_ok("Token validado correctamente")
        else:
            check_error("Token validado pero con datos incorrectos")
            return False
        
        # Verificar JWKS
        jwks = sts_service.get_public_keys()
        if "keys" in jwks and len(jwks["keys"]) > 0:
            check_ok("JWKS endpoint funcional")
        else:
            check_warning("JWKS no contiene claves")
        
        return True
    
    except Exception as e:
        check_error(f"Error en STS: {e}")
        return False

def validate_iam():
    """Valida que el sistema IAM funcione correctamente"""
    print("\n[6/6] Validando IAM/RBAC...")
    
    try:
        from core.security import iam_enforcer, Permission
        
        # Test 1: Actuator puede ejecutar
        if iam_enforcer.check_permission("svc.actuator", Permission.EXECUTE_EXTERNAL):
            check_ok("Actuator tiene permiso EXECUTE_EXTERNAL")
        else:
            check_error("Actuator NO tiene permiso EXECUTE_EXTERNAL")
            return False
        
        # Test 2: Analyst NO puede ejecutar
        if not iam_enforcer.check_permission("svc.analyst", Permission.EXECUTE_EXTERNAL):
            check_ok("Analyst NO tiene permiso EXECUTE_EXTERNAL (correcto)")
        else:
            check_error("Analyst tiene permiso EXECUTE_EXTERNAL (incorrecto)")
            return False
        
        # Test 3: Enterprise puede aprobar
        if iam_enforcer.check_permission("svc.enterprise", Permission.WRITE_APPROVALS):
            check_ok("Enterprise puede escribir aprobaciones")
        else:
            check_error("Enterprise NO puede escribir aprobaciones")
            return False
        
        return True
    
    except Exception as e:
        check_error(f"Error en IAM: {e}")
        return False

def main():
    print("="*60)
    print("🔐 VALIDACIÓN DE FASE 3 - SEGURIDAD E IAM")
    print("="*60)
    
    results = []
    
    # Ejecutar validaciones
    results.append(("Dependencias", validate_dependencies()))
    results.append(("Módulo Seguridad", validate_security_module()))
    results.append(("Archivos Config", validate_config_files()))
    results.append(("Scripts", validate_scripts()))
    results.append(("STS", validate_sts()))
    results.append(("IAM", validate_iam()))
    
    # Resumen
    print("\n" + "="*60)
    print("📊 RESUMEN DE VALIDACIÓN")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = f"{GREEN}PASS{RESET}" if result else f"{RED}FAIL{RESET}"
        print(f"{name:.<30} {status}")
    
    print(f"\nResultado: {passed}/{total} checks pasados")
    
    if passed == total:
        print(f"\n{GREEN}✅ TODAS LAS VALIDACIONES PASARON{RESET}")
        print("\n🚀 El sistema está listo para usar")
        print("\nPróximos pasos:")
        print("  1. Generar certificados: python scripts/generate_certificates.py")
        print("  2. Configurar .env con variables de seguridad")
        print("  3. Iniciar Enterprise: cd microservice_enterprise && python main.py")
        print("  4. Iniciar Actuator: cd microservice_actuator && python main.py")
        return 0
    else:
        print(f"\n{RED}❌ ALGUNAS VALIDACIONES FALLARON{RESET}")
        print("\n⚠️  Revisar los errores arriba y corregir antes de continuar")
        return 1

if __name__ == "__main__":
    sys.exit(main())
