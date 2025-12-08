
@echo off
REM =============================================================================
REM RFC-PHOENIX-02: Startup Script for FASE 2 Messaging Infrastructure
REM Automated deployment for Windows environments
REM =============================================================================

echo ========================================
echo RFC-PHOENIX-02: FASE 2 DEPLOYMENT
echo LeadBoostAI Messaging Infrastructure
echo ========================================
echo.

REM Check Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo [STEP 1] Starting Kafka Cluster...
echo ----------------------------------------
docker-compose -f docker-compose.messaging.yml -f docker-compose.messaging.override.yml up -d

echo.
echo [STEP 2] Waiting for Kafka cluster to be ready...
timeout /t 30 /nobreak

echo.
echo [STEP 3] Verifying Kafka brokers...
docker-compose -f docker-compose.messaging.yml ps

echo.
echo [STEP 4] Checking topic creation...
docker exec leadboost_kafka_broker_1 kafka-topics --list --bootstrap-server localhost:9092

echo.
echo [STEP 5] Installing Python dependencies...
pip install -r requirements_messaging.txt

echo.
echo [STEP 6] Applying database migrations...
echo Please run manually: psql -h localhost -U postgres -d leadboost -f migrations/phase2_messaging.sql

echo.
echo ========================================
echo FASE 2 DEPLOYMENT COMPLETE
echo ========================================
echo.
echo Kafka UI:       http://localhost:8090
echo Health Check:   http://localhost:8000/health (run: python src/messaging/health.py)
echo Metrics:        http://localhost:8000/metrics
echo.
echo To view logs:   docker-compose -f docker-compose.messaging.yml logs -f
echo To stop:        docker-compose -f docker-compose.messaging.yml down
echo.
echo [INFO] For production deployment, use docker-compose.messaging.yml WITHOUT override file
echo.
pause
