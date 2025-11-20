@echo off
echo 🚀 Installing LeadBoostAI BFF Dependencies...
echo.

REM Install core dependencies first (avoid pandas/numpy compilation issues)
echo ⚡ Installing core FastAPI dependencies...
pip install fastapi>=0.110.0 uvicorn>=0.29.0 firebase-admin>=6.5.0 python-dotenv==1.0.0 pydantic>=2.9.0 httpx>=0.25.0

echo.
echo ⚠️ Skipping pandas/numpy for now - they're optional for basic BFF functionality
echo   If needed later, install with: pip install pandas numpy
echo.

echo ✅ Core dependencies installed!
echo.
echo 📋 Next steps:
echo   1. python main.py          # Start BFF server
echo   2. curl localhost:8000/health   # Test connectivity
echo.
pause