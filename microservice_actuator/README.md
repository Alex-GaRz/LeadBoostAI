# Actuator Microservice - Phase 4

## Overview

The **Actuator Engine** is the execution layer of LeadBoostAI, implementing RFC-PHOENIX-04 with strict adherence to **Hexagonal Architecture (Ports & Adapters)**.

### DMC Compliance

Implements **Invariant #5**: *"The Actuator does not think, it only executes."*

- **No autonomous decisions**: All actions must be pre-approved by governance.
- **HITL Enforcement**: Human-In-The-Loop validation via database check.
- **Platform agnostic**: Handlers are pluggable adapters.

## Architecture

```
┌─────────────────────────────────────────┐
│         DRIVING ADAPTERS (Input)        │
│  ┌─────────────────────────────────┐   │
│  │    FastAPI Router (HTTP API)    │   │
│  └─────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│       APPLICATION LAYER (Core)          │
│  ┌─────────────────────────────────┐   │
│  │   ExecutionService (Pipeline)   │   │
│  │  - Governance Check              │   │
│  │  - Handler Selection             │   │
│  │  - Result Persistence            │   │
│  └─────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      DRIVEN ADAPTERS (Output)           │
│  ┌──────────────┐  ┌────────────────┐  │
│  │   Postgres   │  │ MockHandler    │  │
│  │   Ledger     │  │ TwitterHandler │  │
│  │   Repository │  │ MetaHandler    │  │
│  └──────────────┘  └────────────────┘  │
└─────────────────────────────────────────┘
```

## Installation

```bash
cd microservice_actuator
pip install -r requirements.txt
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## Running Locally

```bash
python main.py
```

The service will start on **port 8003**.

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8003/docs
- ReDoc: http://localhost:8003/redoc

## Key Endpoints

### Execute Action
```http
POST /api/v1/actuator/execute
Content-Type: application/json

{
  "action_id": "uuid-from-governance",
  "platform": "MOCK",
  "content_text": "Hello World from Actuator!"
}
```

### Health Check
```http
GET /api/v1/actuator/health
```

## Testing

```bash
# Run with mock handler (no external API calls)
curl -X POST http://localhost:8003/api/v1/actuator/execute \
  -H "Content-Type: application/json" \
  -d '{
    "action_id": "test-123",
    "platform": "MOCK",
    "content_text": "Test execution"
  }'
```

## Docker Deployment

```bash
docker build -t leadboost/actuator:phase4 .
docker run -p 8003:8003 --env-file .env leadboost/actuator:phase4
```

## Adding New Platform Handlers

1. Create handler in `handlers/`:
   ```python
   class TwitterHandler(ISocialPlatformAdapter):
       async def post_content(self, payload):
           # Implementation
   ```

2. Register in `handlers/factory.py`:
   ```python
   elif platform == PlatformType.TWITTER:
       return TwitterHandler()
   ```

## Security Notes

- **NEVER** hardcode credentials in code.
- Use environment variables or secret managers.
- Validate `Authorization` headers in production.
- Implement signature verification for `X-Command-Signature`.

## References

- RFC-PHOENIX-04 (this architecture)
- DMC v1.0 - Chapter: Execution Safeguards
- Hexagonal Architecture: https://alistair.cockburn.us/hexagonal-architecture/
