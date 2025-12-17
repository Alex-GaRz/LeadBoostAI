"""
Example usage and integration test for the Governance Engine.

This script demonstrates how to use the governance module
and validates that all components work together.
"""

import asyncio
from uuid import uuid4

# Import from shared_lib
from contracts import (
    CampaignPayload,
    CampaignState,
    StrategyBrief,
    QualityVerdict,
)

# Import governance module
from governance import audit_campaign, GovernancePipeline


async def test_valid_campaign():
    """Test a campaign that should PASS all checks."""
    print("\n" + "=" * 70)
    print("TEST 1: Valid Campaign (Should PASS)")
    print("=" * 70)
    
    # Create a valid campaign
    payload = CampaignPayload(
        campaign_id=uuid4(),
        tenant_id=uuid4(),
        execution_id=uuid4(),
        current_state=CampaignState.QUALITY_AUDIT,
    )
    
    # Add a valid strategy
    payload.strategy = StrategyBrief(
        target_audience="Tech professionals 25-40",
        core_message="Innovate your business with our cutting-edge solutions. Terms apply.",
        channels=["META", "GOOGLE"],
        budget_allocation={"META": 300.0, "GOOGLE": 200.0},  # Total: 500
    )
    
    # Execute audit
    report = await audit_campaign(payload)
    
    # Print results
    print(f"\n✓ Audit completed:")
    print(f"  - Verdict: {report.verdict.value}")
    print(f"  - Total checks: {len(report.checks)}")
    print(f"  - Passed: {sum(1 for c in report.checks if c.result == QualityVerdict.PASS)}")
    print(f"  - Failed: {sum(1 for c in report.checks if c.result == QualityVerdict.FAIL)}")
    print(f"  - Warnings: {sum(1 for c in report.checks if c.result == QualityVerdict.WARN)}")
    
    print(f"\n✓ Check details:")
    for check in report.checks:
        status_icon = "✓" if check.result == QualityVerdict.PASS else "✗"
        print(f"  {status_icon} {check.check_id}: {check.result.value}")
        if check.evidence:
            msg = check.evidence.get("message", "")
            if msg:
                print(f"    → {msg}")
    
    assert report.verdict == QualityVerdict.PASS, "Expected PASS verdict"
    print("\n✅ TEST 1 PASSED")


async def test_budget_violation():
    """Test a campaign that exceeds budget (Should FAIL)."""
    print("\n" + "=" * 70)
    print("TEST 2: Budget Violation (Should FAIL)")
    print("=" * 70)
    
    payload = CampaignPayload(
        campaign_id=uuid4(),
        tenant_id=uuid4(),
        execution_id=uuid4(),
        current_state=CampaignState.QUALITY_AUDIT,
    )
    
    # Budget exceeds limit (mock genome has 1000 limit)
    payload.strategy = StrategyBrief(
        target_audience="Everyone",
        core_message="Buy now! Amazing deals. Terms apply.",
        channels=["META"],
        budget_allocation={"META": 1500.0},  # EXCEEDS LIMIT!
    )
    
    report = await audit_campaign(payload)
    
    print(f"\n✓ Audit completed:")
    print(f"  - Verdict: {report.verdict.value}")
    
    # Find the budget check
    budget_check = next(c for c in report.checks if c.check_id == "FIN_001_BUDGET_CAP")
    print(f"\n✓ Budget Check:")
    print(f"  - Result: {budget_check.result.value}")
    print(f"  - Reason: {budget_check.reason_code}")
    print(f"  - Evidence: {budget_check.evidence}")
    
    assert report.verdict == QualityVerdict.FAIL, "Expected FAIL verdict"
    assert budget_check.result == QualityVerdict.FAIL, "Expected budget check to fail"
    print("\n✅ TEST 2 PASSED")


async def test_forbidden_words():
    """Test a campaign with forbidden words (Should FAIL)."""
    print("\n" + "=" * 70)
    print("TEST 3: Forbidden Words (Should FAIL)")
    print("=" * 70)
    
    payload = CampaignPayload(
        campaign_id=uuid4(),
        tenant_id=uuid4(),
        execution_id=uuid4(),
        current_state=CampaignState.QUALITY_AUDIT,
    )
    
    # Message contains forbidden word "spam"
    payload.strategy = StrategyBrief(
        target_audience="Everyone",
        core_message="This is not spam, we promise! Get your free stuff now. Terms apply.",
        channels=["META"],
        budget_allocation={"META": 500.0},
    )
    
    report = await audit_campaign(payload)
    
    print(f"\n✓ Audit completed:")
    print(f"  - Verdict: {report.verdict.value}")
    
    # Find the keyword check
    keyword_check = next(c for c in report.checks if c.check_id == "TXT_001_KEYWORD_BLACKLIST")
    print(f"\n✓ Keyword Blacklist Check:")
    print(f"  - Result: {keyword_check.result.value}")
    print(f"  - Reason: {keyword_check.reason_code}")
    print(f"  - Violations: {keyword_check.evidence.get('violated_words', [])}")
    
    assert report.verdict == QualityVerdict.FAIL, "Expected FAIL verdict"
    assert keyword_check.result == QualityVerdict.FAIL, "Expected keyword check to fail"
    print("\n✅ TEST 3 PASSED")


async def test_unauthorized_channel():
    """Test a campaign with unauthorized channel (Should FAIL)."""
    print("\n" + "=" * 70)
    print("TEST 4: Unauthorized Channel (Should FAIL)")
    print("=" * 70)
    
    payload = CampaignPayload(
        campaign_id=uuid4(),
        tenant_id=uuid4(),
        execution_id=uuid4(),
        current_state=CampaignState.QUALITY_AUDIT,
    )
    
    # Using unauthorized channel "TWITTER"
    payload.strategy = StrategyBrief(
        target_audience="Social media users",
        core_message="Follow us for updates. Terms apply.",
        channels=["TWITTER"],  # NOT AUTHORIZED!
        budget_allocation={"TWITTER": 500.0},
    )
    
    report = await audit_campaign(payload)
    
    print(f"\n✓ Audit completed:")
    print(f"  - Verdict: {report.verdict.value}")
    
    # Find the channel check
    channel_check = next(c for c in report.checks if c.check_id == "FIN_003_CHANNEL_AUTHORIZATION")
    print(f"\n✓ Channel Authorization Check:")
    print(f"  - Result: {channel_check.result.value}")
    print(f"  - Unauthorized: {channel_check.evidence.get('unauthorized_channels', [])}")
    
    assert report.verdict == QualityVerdict.FAIL, "Expected FAIL verdict"
    assert channel_check.result == QualityVerdict.FAIL, "Expected channel check to fail"
    print("\n✅ TEST 4 PASSED")


async def test_custom_pipeline():
    """Test creating a custom pipeline with specific rules."""
    print("\n" + "=" * 70)
    print("TEST 5: Custom Pipeline (Financial Rules Only)")
    print("=" * 70)
    
    # Import specific rules
    from governance import BudgetCapRule, ChannelAuthorizationRule
    
    # Create pipeline with only financial rules
    pipeline = GovernancePipeline(rules=[
        BudgetCapRule,
        ChannelAuthorizationRule,
    ])
    
    payload = CampaignPayload(
        campaign_id=uuid4(),
        tenant_id=uuid4(),
        execution_id=uuid4(),
        current_state=CampaignState.QUALITY_AUDIT,
    )
    
    payload.strategy = StrategyBrief(
        target_audience="Test",
        core_message="spam spam spam",  # Would normally fail keyword check
        channels=["META"],
        budget_allocation={"META": 500.0},
    )
    
    report = await pipeline.execute_audit(payload)
    
    print(f"\n✓ Custom pipeline executed:")
    print(f"  - Verdict: {report.verdict.value}")
    print(f"  - Rules executed: {len(report.checks)}")
    print(f"  - Rule IDs: {[c.check_id for c in report.checks]}")
    
    # Should PASS because we're not checking keywords
    assert report.verdict == QualityVerdict.PASS, "Expected PASS (keywords not checked)"
    assert len(report.checks) == 2, "Expected only 2 checks"
    print("\n✅ TEST 5 PASSED")


async def main():
    """Run all tests."""
    print("=" * 70)
    print("GOVERNANCE ENGINE - INTEGRATION TESTS")
    print("=" * 70)
    
    try:
        await test_valid_campaign()
        await test_budget_violation()
        await test_forbidden_words()
        await test_unauthorized_channel()
        await test_custom_pipeline()
        
        print("\n" + "=" * 70)
        print("✅ ALL TESTS PASSED - GOVERNANCE ENGINE OPERATIONAL")
        print("=" * 70)
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        raise
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    # Note: This requires shared_lib to be installed
    # Run: cd shared_lib && pip install -e .
    asyncio.run(main())
