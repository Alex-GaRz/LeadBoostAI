# Fase 5 Implementation - Core Orchestrator

This directory contains the Phase 5 implementation of LeadBoostAI: The Core Orchestrator and Contracts Library.

## What's Included

### 1. **Shared Contracts Library** (`shared_lib/`)
Enterprise-grade Pydantic models for all campaign data:
- **Enums**: `CampaignState`, `QualityVerdict`, `Severity`, `FailureReason`
- **Artifacts**: `StrategyBrief`, `QualityReport`, `QualityCheck`
- **Payload**: `CampaignPayload` with idempotency controls

### 2. **Core Orchestrator** (`core_orchestrator/`)
FastAPI-based orchestration service:
- **Finite State Machine**: Using `transitions` library
- **Service Client**: HTTP-based communication (NO direct imports)
- **Idempotency Store**: Redis + in-memory fallback
- **Quality Gates**: Enterprise-grade quality checks

## Architecture

```
┌─────────────────────────────────────────┐
│       Core Orchestrator (FSM)           │
│                                         │
│  IDLE → RADAR → STRATEGY → CONTENT     │
│         PROD → AUDIT → PUBLISH → LEARN │
└─────────────────────────────────────────┘
            ↓ HTTP Calls Only ↓
┌──────────┬──────────┬──────────┬──────────┐
│  Radar   │ Analyst  │  Visual  │Optimizer │
│ Service  │ Service  │  Engine  │ Service  │
└──────────┴──────────┴──────────┴──────────┘
```

## Installation

### Option 1: Quick Install (Windows)
```cmd
install_fase5.bat
```

### Option 2: Quick Install (Linux/Mac)
```bash
chmod +x install_fase5.sh
./install_fase5.sh
```

### Option 3: Manual Install
```bash
# Install contracts library
cd shared_lib
pip install -e .

# Install orchestrator
cd ../core_orchestrator
pip install -r requirements.txt
```

## Configuration

1. Copy environment template:
```bash
cd core_orchestrator
cp .env.example .env
```

2. Edit `.env` and configure service URLs:
```
SERVICE_RADAR_URL=http://localhost:8001
SERVICE_ANALYST_URL=http://localhost:8002
SERVICE_VISUAL_URL=http://localhost:8003
SERVICE_OPTIMIZER_URL=http://localhost:8004
```

## Running

```bash
cd core_orchestrator
uvicorn app.main:app --reload --port 8000
```

Access the API docs at: http://localhost:8000/docs

## API Endpoints

### Create Campaign
```http
POST /api/v1/campaigns
Content-Type: application/json

{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "metadata": {"source": "web_ui"}
}
```

### Get Campaign Status
```http
GET /api/v1/campaigns/{campaign_id}
```

### Start Campaign Workflow
```http
POST /api/v1/campaigns/{campaign_id}/start
```

### Retry Failed Campaign
```http
POST /api/v1/campaigns/{campaign_id}/retry
```

## Key Features

### 1. **Idempotency**
- Each execution has a unique `execution_id`
- Prevents duplicate processing with Redis/in-memory store
- Safe for retries and failures

### 2. **Quality Gates**
- Strict checks before publication
- Blocks on CRITICAL severity issues
- Detailed failure reasons

### 3. **Service Isolation**
- **ZERO** direct imports from other services
- All communication via HTTP (httpx)
- Clean architectural boundaries

### 4. **Retry Logic**
- Configurable retry limits (`max_retries`)
- Exponential backoff support
- Classified failure reasons

### 5. **Audit Trail**
- Complete execution log in `CampaignPayload`
- Timestamped trace entries
- Actor service tracking

## Development

### Running Tests
```bash
cd shared_lib
pytest

cd ../core_orchestrator
pytest
```

### Type Checking
```bash
mypy shared_lib/src
mypy core_orchestrator
```

### Code Formatting
```bash
black shared_lib/src
black core_orchestrator
```

## Next Steps

1. **Implement Storage Layer**: Add PostgreSQL/MongoDB for campaign persistence
2. **Add Authentication**: Secure the API endpoints
3. **Monitoring**: Add Prometheus metrics and tracing
4. **Webhooks**: Notify external systems on state changes
5. **Advanced Retry**: Implement exponential backoff with jitter

## Troubleshooting

### Import Error: "No module named 'contracts'"
Make sure you installed the shared_lib:
```bash
cd shared_lib
pip install -e .
```

### Service Unreachable
Check that service URLs in `.env` are correct and services are running.

### Redis Connection Failed
The orchestrator falls back to in-memory store automatically. To use Redis:
```bash
# Install Redis
# On Windows: Use WSL or Docker
# On Linux: sudo apt install redis-server

# Update .env
REDIS_URL=redis://localhost:6379/0
USE_IN_MEMORY_STORE=False
```

## Contact

For questions about Phase 5 implementation, refer to [FASE 5.md](blue_prints/FASE%205.md).
