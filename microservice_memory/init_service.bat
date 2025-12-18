@echo off
REM Script de Inicialización del Memory Service - FASE 6.1 (Windows)

echo ============================================
echo Memory Service - FASE 6.1 Initialization
echo ============================================
echo.

REM Verificar Python
echo 1. Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo X Python 3.11+ no encontrado
    exit /b 1
)
python --version
echo OK Python OK
echo.

REM Crear entorno virtual
echo 2. Creando entorno virtual...
if not exist "venv" (
    python -m venv venv
    echo OK Entorno virtual creado
) else (
    echo OK Entorno virtual ya existe
)
echo.

REM Activar entorno
echo 3. Activando entorno...
call venv\Scripts\activate.bat
echo OK Entorno activado
echo.

REM Instalar dependencias
echo 4. Instalando dependencias...
python -m pip install --upgrade pip
pip install -r requirements.txt
echo OK Dependencias instaladas
echo.

REM Crear directorio ChromaDB
echo 5. Creando directorio ChromaDB...
if not exist "chroma_db" mkdir chroma_db
echo OK Directorio creado
echo.

REM Copiar .env si no existe
echo 6. Configurando variables de entorno...
if not exist ".env" (
    copy .env.example .env
    echo ! Archivo .env creado desde .env.example
    echo ! IMPORTANTE: Edita .env y agrega tu OPENAI_API_KEY
) else (
    echo OK Archivo .env ya existe
)
echo.

REM Verificar configuración
echo 7. Verificando configuración...
findstr /C:"your-openai-api-key-here" .env >nul 2>&1
if not errorlevel 1 (
    echo ! WARNING: OPENAI_API_KEY no configurada
    echo   El servicio usará embeddings locales (fallback)
) else (
    echo OK Configuración lista
)
echo.

echo ============================================
echo OK Inicialización completa
echo ============================================
echo.
echo Para iniciar el servicio:
echo   venv\Scripts\activate
echo   python main.py
echo.
echo Documentación API:
echo   http://localhost:8006/docs
echo.

pause
