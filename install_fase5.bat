@echo off
REM Installation script for LeadBoostAI Phase 5

echo ========================================
echo LeadBoostAI Phase 5 - Installation
echo ========================================
echo.

echo [1/2] Installing shared_lib (contracts)...
cd shared_lib
pip install -e .
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install shared_lib
    exit /b 1
)
echo.

echo [2/2] Installing core_orchestrator...
cd ..\core_orchestrator
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install core_orchestrator dependencies
    exit /b 1
)
echo.

echo ========================================
echo Installation complete!
echo ========================================
echo.
echo To run the orchestrator:
echo   cd core_orchestrator
echo   uvicorn app.main:app --reload --port 8000
echo.
echo Don't forget to copy .env.example to .env and configure service URLs!
echo.

pause
