# Core Orchestrator - Phoenix V5

Enterprise-grade orchestrator for LeadBoostAI campaign workflows.

## Features

- **State Machine**: Finite State Machine (FSM) using `transitions` library
- **Idempotency**: Execution ID tracking to prevent duplicate processing
- **Service Isolation**: HTTP-based communication, no direct imports from other microservices
- **Quality Gates**: Strict quality checks before publication
- **Retry Logic**: Configurable retry limits with exponential backoff

## Architecture

```
core_orchestrator/
├── app/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration
│   └── api/
│       └── routes.py        # API endpoints
├── domain/
│   ├── fsm.py              # OrchestratorFSM implementation
│   └── workflow.py         # Workflow logic
├── infrastructure/
│   ├── service_client.py   # Generic HTTP client
│   └── idempotency.py      # Idempotency store
└── requirements.txt
```

## Installation

```bash
cd core_orchestrator
pip install -r requirements.txt
```

## Running

```bash
uvicorn app.main:app --reload --port 8000
```

## Environment Variables

- `SERVICE_RADAR_URL`: URL for the Radar service
- `SERVICE_ANALYST_URL`: URL for the Analyst service
- `SERVICE_VISUAL_URL`: URL for the Visual engine
- `SERVICE_OPTIMIZER_URL`: URL for the Optimizer service
- `REDIS_URL`: Redis URL for idempotency tracking (optional)
