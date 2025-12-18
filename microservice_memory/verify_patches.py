"""
Verification Script - Security & Resilience Patches FASE 6.1
Verifica que los parches estén correctamente aplicados.
"""

import sys
import os

# Agregar el directorio padre al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def verify_patches():
    """Verifica que todos los parches estén aplicados correctamente."""
    
    print("=" * 70)
    print("VERIFICACIÓN DE PARCHES DE SEGURIDAD - FASE 6.1")
    print("=" * 70)
    print()
    
    results = []
    
    # PATCH 1: Logging Robusto
    print("✓ Verificando PATCH 1: Logging Robusto (vector_store.py)...")
    try:
        with open("core/vector_store.py", "r", encoding="utf-8") as f:
            content = f.read()
            
        checks = [
            ('exc_info=True' in content, "✓ exc_info=True presente"),
            ('extra={' in content, "✓ extra dictionary presente"),
            ('"tenant_id": tenant_id' in content, "✓ tenant_id en extra"),
            ('VECTOR SEARCH FAILED' in content, "✓ Mensaje de error mejorado")
        ]
        
        for passed, message in checks:
            print(f"  {message if passed else '✗ ' + message.replace('✓', 'FALLO:')}")
            results.append(passed)
    except Exception as e:
        print(f"  ✗ Error leyendo archivo: {e}")
        results.append(False)
    
    print()
    
    # PATCH 2: Protección de Producción
    print("✓ Verificando PATCH 2: Protección de Producción (vector_store.py)...")
    try:
        with open("core/vector_store.py", "r", encoding="utf-8") as f:
            content = f.read()
            
        checks = [
            ('ENVIRONMENT' in content, "✓ Chequeo de ENVIRONMENT presente"),
            ('production' in content, "✓ Validación de entorno producción"),
            ('Cannot reset collection in production' in content, "✓ Mensaje de error claro"),
            ('RuntimeError' in content, "✓ RuntimeError se levanta")
        ]
        
        for passed, message in checks:
            print(f"  {message if passed else '✗ ' + message.replace('✓', 'FALLO:')}")
            results.append(passed)
    except Exception as e:
        print(f"  ✗ Error leyendo archivo: {e}")
        results.append(False)
    
    print()
    
    # PATCH 3: Resiliencia de Red
    print("✓ Verificando PATCH 3: Resiliencia de Red (embedding_engine.py)...")
    try:
        with open("core/embedding_engine.py", "r", encoding="utf-8") as f:
            content = f.read()
            
        checks = [
            ('min=4' in content, "✓ min=4 segundos configurado"),
            ('max=10' in content, "✓ max=10 segundos configurado"),
            ('@retry' in content, "✓ Decorador @retry presente"),
            ('stop_after_attempt(3)' in content, "✓ 3 intentos de retry")
        ]
        
        for passed, message in checks:
            print(f"  {message if passed else '✗ ' + message.replace('✓', 'FALLO:')}")
            results.append(passed)
    except Exception as e:
        print(f"  ✗ Error leyendo archivo: {e}")
        results.append(False)
    
    print()
    
    # PATCH 4: Sanitización de Logs
    print("✓ Verificando PATCH 4: Sanitización de Logs (routes.py)...")
    try:
        with open("api/routes.py", "r", encoding="utf-8") as f:
            content = f.read()
            
        checks = [
            ('safe_query' in content, "✓ Variable safe_query presente"),
            ("replace('\\n', ' ')" in content, "✓ Reemplazo de \\n"),
            ("replace('\\r', ' ')" in content, "✓ Reemplazo de \\r"),
            ('[:50]' in content, "✓ Truncado a 50 caracteres")
        ]
        
        for passed, message in checks:
            print(f"  {message if passed else '✗ ' + message.replace('✓', 'FALLO:')}")
            results.append(passed)
    except Exception as e:
        print(f"  ✗ Error leyendo archivo: {e}")
        results.append(False)
    
    print()
    
    # PATCH 5: Configuración
    print("✓ Verificando PATCH 5: Configuración (config.py)...")
    try:
        with open("core/config.py", "r", encoding="utf-8") as f:
            content = f.read()
            
        checks = [
            ('ENVIRONMENT: str' in content, "✓ Variable ENVIRONMENT definida"),
            ('"development"' in content, "✓ Valor por defecto 'development'")
        ]
        
        for passed, message in checks:
            print(f"  {message if passed else '✗ ' + message.replace('✓', 'FALLO:')}")
            results.append(passed)
    except Exception as e:
        print(f"  ✗ Error leyendo archivo: {e}")
        results.append(False)
    
    print()
    
    # PATCH 6: .env.example
    print("✓ Verificando PATCH 6: Template de Configuración (.env.example)...")
    try:
        with open(".env.example", "r", encoding="utf-8") as f:
            content = f.read()
            
        checks = [
            ('ENVIRONMENT=' in content, "✓ Variable ENVIRONMENT en .env.example")
        ]
        
        for passed, message in checks:
            print(f"  {message if passed else '✗ ' + message.replace('✓', 'FALLO:')}")
            results.append(passed)
    except Exception as e:
        print(f"  ✗ Error leyendo archivo: {e}")
        results.append(False)
    
    print()
    print("=" * 70)
    
    passed_count = sum(results)
    total_count = len(results)
    success_rate = (passed_count / total_count * 100) if total_count > 0 else 0
    
    print(f"RESULTADOS: {passed_count}/{total_count} checks pasados ({success_rate:.1f}%)")
    
    if passed_count == total_count:
        print("✅ TODOS LOS PARCHES ESTÁN CORRECTAMENTE APLICADOS")
        return 0
    else:
        print(f"⚠️  FALTAN {total_count - passed_count} PARCHES POR APLICAR")
        return 1


if __name__ == "__main__":
    exit_code = verify_patches()
    sys.exit(exit_code)
