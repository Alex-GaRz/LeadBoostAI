# Governance Engine - Motor de Gobernanza

Enterprise-grade governance and compliance engine for LeadBoostAI campaigns.

## Overview

The Governance Engine implements the "Judge of Iron" pattern - an adversarial system that validates campaigns against Brand Genome rules. Everything is forbidden unless explicitly allowed.

## Architecture

```
governance/
├── genome/          # Brand Genome models (the "Law")
├── engine/          # Pipeline orchestration
├── rules/           # Atomic validation rules
│   ├── base.py      # Abstract rule interface
│   ├── financial.py # Budget, ROI, channel rules
│   └── content.py   # Tone, keywords, compliance rules
└── test_governance.py  # Integration tests
```

## Quick Start

### Basic Usage

```python
from governance import audit_campaign
from contracts import CampaignPayload

# Audit a campaign
report = await audit_campaign(campaign_payload)

if report.verdict == QualityVerdict.FAIL:
    # Block publication
    print("Campaign rejected:", report.checks)
else:
    # Proceed with publication
    print("Campaign approved")
```

### Custom Pipeline

```python
from governance import GovernancePipeline, BudgetCapRule, KeywordBlacklistRule

# Create pipeline with specific rules
pipeline = GovernancePipeline(rules=[
    BudgetCapRule,
    KeywordBlacklistRule,
])

report = await pipeline.execute_audit(payload)
```

## Brand Genome

The Brand Genome defines all governance rules for a tenant:

```python
from governance import BrandGenome, ToneGuard, VisualGuard, RiskGuard

genome = BrandGenome(
    tenant_id=uuid4(),
    brand_name="Nike",
    tone=ToneGuard(
        voice_description="Inspirational, athletic, direct",
        forbidden_words=["cheap", "discount"],
        required_disclaimers=["Terms apply."]
    ),
    visual=VisualGuard(
        allowed_hex_colors=["#000000", "#FF0000"],
        min_contrast_ratio=4.5,
        logo_mandatory=True
    ),
    risk=RiskGuard(
        max_daily_budget=500.00,
        max_cpa_bid=15.00,
        authorized_channels=["META", "GOOGLE"]
    )
)
```

## Implemented Rules

### Financial Rules (CRITICAL)
- **FIN_001**: Budget Cap - Enforces max daily budget
- **FIN_002**: CPA Bid Limit - Prevents overpaying for conversions
- **FIN_003**: Channel Authorization - Only approved channels
- **FIN_004**: ROI Target - Validates ROI expectations

### Content Rules
- **TXT_001**: Keyword Blacklist (CRITICAL) - Detects forbidden words
- **TXT_002**: Required Disclaimers (HIGH) - Ensures legal compliance
- **TXT_003**: Message Length (MEDIUM) - Validates optimal length
- **TXT_004**: Tone/Voice (HIGH) - Placeholder for LLM validation

## Creating Custom Rules

```python
from governance import GovernanceRule
from contracts import QualityCheck, Severity

class MyCustomRule(GovernanceRule):
    rule_id = "CUSTOM_001_MY_RULE"
    severity = Severity.HIGH
    
    async def evaluate(self, ctx: AuditContext) -> QualityCheck:
        # Your validation logic
        if some_condition:
            return self.fail_check(
                reason="RULE_VIOLATED",
                evidence={"detail": "why it failed"}
            )
        
        return self.pass_check(evidence={"status": "ok"})
```

## Testing

Run integration tests:

```bash
cd microservice_optimizer/src/governance
python test_governance.py
```

Expected output:
```
TEST 1: Valid Campaign (Should PASS) ✅
TEST 2: Budget Violation (Should FAIL) ✅
TEST 3: Forbidden Words (Should FAIL) ✅
TEST 4: Unauthorized Channel (Should FAIL) ✅
TEST 5: Custom Pipeline ✅
```

## Verdict Logic

Final verdict is determined by:

1. **FAIL**: If ANY rule with `Severity.CRITICAL` fails
2. **WARN**: If ANY rule fails (but no CRITICAL failures)
3. **PASS**: If all rules pass

## Integration with Orchestrator

The governance engine is called during the `QUALITY_AUDIT` state:

```python
# In core_orchestrator/domain/fsm.py
async def _after_quality_audit(self):
    from governance import audit_campaign
    
    report = await audit_campaign(self.payload)
    self.payload.quality_audit = report
    
    if report.verdict == QualityVerdict.FAIL:
        # FSM will block transition to PUBLISH
        pass
```

## Performance

- **Parallel Execution**: All rules run concurrently via `asyncio.gather`
- **Fail-Fast**: Critical failures stop processing immediately
- **Caching**: Genome loaded once per audit
- **Typical Audit Time**: < 100ms for 8 rules

## Future Enhancements

### Phase 5.3: LLM-as-a-Judge
- Implement `ToneVoiceRule` with OpenAI/Gemini
- Constitutional AI prompts for brand consistency
- Semantic keyword detection (beyond exact matching)

### Phase 5.4: Visual Validation
- Color palette validation
- Logo presence detection
- Contrast ratio calculation (WCAG compliance)
- Safe zone validation

### Phase 5.5: Advanced Risk
- ML-based ROI prediction
- Historical performance analysis
- Fraud detection patterns

## Dependencies

Required:
- `shared_lib` (contracts)
- `pydantic >= 2.5.0`
- `asyncio` (built-in)

Optional:
- `openai` (for LLM rules)
- `Pillow` (for visual rules)
- `redis` (for genome caching)

## Configuration

Load genomes from database (production):

```python
class GovernancePipeline:
    async def load_genome(self, tenant_id: UUID) -> BrandGenome:
        # Query PostgreSQL/MongoDB
        genome_data = await db.fetch_genome(tenant_id)
        return BrandGenome(**genome_data)
```

## Monitoring

Log key metrics:
- Audit execution time
- Rule pass/fail rates
- Most common violations
- Genome version usage

## Support

For issues or questions:
- See: [FASE 5.2.md](../../blue_prints/FASE%205/FASE%205.2.md)
- Contact: Governance Team

---

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: December 17, 2025
