@echo off
REM Script de inicializacion rapida - Fase 3
REM RFC-PHOENIX-03: Seguridad, IAM y Gestion de Secretos

echo ============================================================
echo  LEADBOOSTAI - FASE 3: SEGURIDAD E IAM
echo  Inicializacion Rapida
echo ============================================================
echo.

REM 1. Verificar Python
echo [1/5] Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python no encontrado. Instala Python 3.9+
    pause
    exit /b 1
)
echo [OK] Python encontrado
echo.

REM 2. Instalar dependencias
echo [2/5] Instalando dependencias...
pip install -q -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Error instalando dependencias
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas
echo.

REM 3. Generar certificados
echo [3/5] Generando certificados mTLS...
python scripts/generate_certificates.py
if errorlevel 1 (
    echo [ERROR] Error generando certificados
    pause
    exit /b 1
)
echo [OK] Certificados generados
echo.

REM 4. Verificar configuracion
echo [4/5] Verificando configuracion...
if not exist "config\security\iam_policies.yaml" (
    echo [ERROR] Archivo de politicas IAM no encontrado
    pause
    exit /b 1
)
if not exist "config\security\service_identities.yaml" (
    echo [ERROR] Archivo de identidades no encontrado
    pause
    exit /b 1
)
echo [OK] Configuracion validada
echo.

REM 5. Ejecutar ejemplo de demostracion
echo [5/5] Ejecutando demostracion de seguridad...
python examples/secure_integration_example.py
if errorlevel 1 (
    echo [ADVERTENCIA] Error en demostracion (es normal si servicios no estan corriendo)
)
echo.

echo ============================================================
echo  INICIALIZACION COMPLETA
echo ============================================================
echo.
echo Proximos pasos:
echo   1. Revisar configuracion en config/security/
echo   2. Configurar .env con variables de seguridad
echo   3. Iniciar servicios:
echo      - Enterprise: cd microservice_enterprise ^&^& python main.py
echo      - Actuator:   cd microservice_actuator ^&^& python main.py
echo   4. Probar endpoints del STS:
echo      - POST http://localhost:8011/sts/token
echo      - GET  http://localhost:8011/sts/jwks
echo.
echo Documentacion completa: README_FASE3.md
echo.
pause
