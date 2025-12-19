# QUICK START: Governance Integration
## Setup & Testing in 5 Minutes

**Date**: December 17, 2025  
**Status**: Ready for Testing

---

## 🚀 INSTALLATION

### Step 1: Install Shared Library

```bash
# Navigate to shared_lib
cd c:\Dev\LeadBoostAI\shared_lib

# Install in editable mode
pip install -e .

# Verify installation
python -c "from contracts import CampaignPayload; print('✅ Contracts OK')"
```

**Expected Output**:
```
✅ Contracts OK
```

### Step 2: Start Governance API

```bash
# Navigate to project root
cd c:\Dev\LeadBoostAI

# Start microservice_optimizer
python -m microservice_optimizer.main
```

**Expected Output**:
```
INFO - ✅ Governance API routes registered
INFO - Application startup complete
INFO - Uvicorn running on http://0.0.0.0:8000
```

### Step 3: Verify Health

```bash
# In new terminal
curl http://localhost:8000/api/v1/health
```

**Expected Output**:
```json
{
  "status": "healthy",
  "service": "governance_engine",
  "version": "1.0.0",
  "capabilities": {
    "financial_rules": 4,
    "content_rules": 4,
    "visual_rules": 0,
    "total_rules": 8
  }
}
```

---

## 🧪 QUICK TEST

### Option 1: Integration Test Script

```bash
# Run automated tests
python tests\test_governance_integration.py
```

**Expected Output**:
```
✅ PASSED: Payload Serialization
✅ PASSED: Direct HTTP Call
✅ PASSED: ServiceClient Integration

🎉 ALL TESTS PASSED - INTEGRATION COMPLETE!
```

### Option 2: Manual cURL Test

```bash
curl -X POST http://localhost:8000/api/v1/audit-quality ^
  -H "Content-Type: application/json" ^
  -d "{\"campaign_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"tenant_id\":\"660e8400-e29b-41d4-a716-446655440000\",\"execution_id\":\"770e8400-e29b-41d4-a716-446655440000\",\"current_state\":\"QUALITY_AUDIT\",\"strategy\":{\"campaign_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"tenant_id\":\"660e8400-e29b-41d4-a716-446655440000\",\"channels\":[\"META\"],\"budget_allocation\":{\"META\":\"300.00\"},\"core_message\":\"Buy now! Terms apply.\",\"target_audience\":\"Everyone\",\"kpis\":{\"target_cpa\":\"10.00\",\"target_roi\":\"3.0\"},\"execution_timeline\":\"Launch tomorrow\"},\"assets\":[{\"asset_id\":\"img_001\",\"type\":\"image\",\"url\":\"https://example.com/ad.jpg\"}]}"
```

**Expected**: HTTP 200 with JSON QualityReport

### Option 3: Python Interactive Test

```python
import asyncio
from uuid import uuid4
from decimal import Decimal
from contracts import CampaignPayload, StrategyBrief, CampaignState

# Create test payload
campaign_id = uuid4()
strategy = StrategyBrief(
    campaign_id=campaign_id,
    tenant_id=uuid4(),
    channels=["META"],
    budget_allocation={"META": Decimal("300.00")},
    core_message="Buy now! Terms apply.",
    target_audience="Everyone",
    kpis={"target_cpa": Decimal("10.00"), "target_roi": Decimal("3.0")},
    execution_timeline="Launch tomorrow"
)

payload = CampaignPayload(
    campaign_id=campaign_id,
    tenant_id=uuid4(),
    execution_id=uuid4(),
    current_state=CampaignState.QUALITY_AUDIT,
    strategy=strategy,
    assets=[{"asset_id": "img_001", "type": "image"}]
)

# Test via ServiceClient
import sys, os
sys.path.append(os.path.join(os.getcwd(), 'core_orchestrator'))
from infrastructure.service_client import ServiceClient

async def test():
    client = ServiceClient(
        radar_url="http://localhost:8001",
        analyst_url="http://localhost:8002",
        visual_url="http://localhost:8003",
        optimizer_url="http://localhost:8000"
    )
    report = await client.call_quality_audit(payload)
    print(f"Verdict: {report.verdict.value}")
    print(f"Checks: {len(report.checks)}")
    await client.close()

asyncio.run(test())
```

---

## 🔍 TROUBLESHOOTING

### Error: "Import 'contracts' could not be resolved"

**Cause**: shared_lib not installed  
**Fix**:
```bash
cd shared_lib
pip install -e .
```

### Error: "Connection refused [Errno 10061]"

**Cause**: microservice_optimizer not running  
**Fix**:
```bash
python -m microservice_optimizer.main
```

### Error: "Cannot audit quality without assets"

**Cause**: Payload validation failed in ServiceClient  
**Fix**: Ensure payload has at least 1 asset:
```python
payload.assets = [{"asset_id": "test", "type": "image"}]
```

### Error: "422 Unprocessable Entity"

**Cause**: Invalid payload schema  
**Fix**: Check logs for validation error details:
```
INFO - Invalid payload: strategy is required
```

---

## 📊 WHAT TO EXPECT

### Successful Audit Response

```json
{
  "campaign_id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "660e8400-e29b-41d4-a716-446655440000",
  "verdict": "PASS",
  "checks": [
    {
      "check_id": "FIN_001",
      "rule_name": "Budget Cap Rule",
      "result": "PASS",
      "severity": "CRITICAL",
      "reason_code": null,
      "evidence": {
        "total_budget": 300.0,
        "max_allowed": 1000.0
      }
    },
    {
      "check_id": "FIN_002",
      "rule_name": "CPA Bid Limit Rule",
      "result": "PASS",
      "severity": "HIGH",
      "reason_code": null,
      "evidence": {
        "target_cpa": 10.0,
        "max_cpa": 50.0
      }
    },
    {
      "check_id": "FIN_003",
      "rule_name": "Channel Authorization Rule",
      "result": "PASS",
      "severity": "CRITICAL",
      "reason_code": null,
      "evidence": {
        "requested_channels": ["META"],
        "authorized_channels": ["META", "GOOGLE"]
      }
    },
    {
      "check_id": "TXT_001",
      "rule_name": "Keyword Blacklist Rule",
      "result": "PASS",
      "severity": "CRITICAL",
      "reason_code": null,
      "evidence": {
        "message": "Buy now! Terms apply.",
        "forbidden_words_found": []
      }
    },
    ...
  ],
  "audit_timestamp": "2025-12-17T10:30:00.000000Z",
  "metadata": {}
}
```

### Failed Audit Response (Budget Violation)

```json
{
  "verdict": "FAIL",
  "checks": [
    {
      "check_id": "FIN_001",
      "rule_name": "Budget Cap Rule",
      "result": "FAIL",
      "severity": "CRITICAL",
      "reason_code": "BUDGET_EXCEEDED",
      "evidence": {
        "total_budget": 1500.0,
        "max_allowed": 1000.0,
        "overage": 500.0
      }
    },
    ...
  ]
}
```

---

## 🎯 NEXT STEPS

After successful testing:

1. **Integrate with FSM**: Update `core_orchestrator/domain/fsm.py`
   ```python
   async def _after_quality_audit(self):
       report = await self.service_client.call_quality_audit(self.payload)
       self.payload.quality_audit = report
   ```

2. **Deploy to Docker**: Update docker-compose.yml
   ```yaml
   microservice_optimizer:
     environment:
       - PYTHONPATH=/app:/app/shared_lib
     volumes:
       - ./shared_lib:/app/shared_lib
   ```

3. **Run End-to-End Test**: Test complete campaign workflow from IDLE → PUBLISH

4. **Monitor Logs**: Check for audit performance and rule violations

---

## 📚 DOCUMENTATION

- **Full Integration Guide**: [HTTP_INTEGRATION_GUIDE.md](HTTP_INTEGRATION_GUIDE.md)
- **Governance Implementation**: [FASE5.2_IMPLEMENTATION_SUMMARY.md](FASE5.2_IMPLEMENTATION_SUMMARY.md)
- **Governance Usage**: [microservice_optimizer/src/governance/README.md](microservice_optimizer/src/governance/README.md)
- **Phase 5 Blueprint**: [blue_prints/FASE 5/FASE 5.2.md](blue_prints/FASE%205/FASE%205.2.md)

---

**Ready to test!** 🚀

Start with Step 1 (install shared_lib) and proceed through the Quick Test options.
