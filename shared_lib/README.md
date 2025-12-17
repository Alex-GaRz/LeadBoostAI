# LeadBoostAI Contracts Library

Shared contracts library for LeadBoostAI Phoenix V5 - Fase 5 implementation.

## Installation

From the repository root:

```bash
cd shared_lib
pip install -e .
```

## Usage

```python
from contracts.payload import CampaignPayload
from contracts.enums import CampaignState
from contracts.artifacts import StrategyBrief, QualityReport

# Create a campaign payload
payload = CampaignPayload(
    campaign_id=uuid4(),
    tenant_id=uuid4(),
    execution_id=uuid4(),
    current_state=CampaignState.IDLE
)
```

## Structure

- `contracts/base.py` - Base models with UUIDs and time mixins
- `contracts/enums.py` - All system enumerations
- `contracts/artifacts.py` - Business artifacts (StrategyBrief, QualityReport)
- `contracts/payload.py` - The master CampaignPayload with idempotency
