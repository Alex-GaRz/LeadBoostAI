"""
Quick test script to verify contracts library installation.
"""

from uuid import uuid4
from contracts import (
    CampaignPayload,
    CampaignState,
    StrategyBrief,
    QualityReport,
    QualityCheck,
    QualityVerdict,
    Severity,
    FailureReason,
)


def test_campaign_payload():
    """Test creating a campaign payload."""
    print("Testing CampaignPayload creation...")
    
    payload = CampaignPayload(
        campaign_id=uuid4(),
        tenant_id=uuid4(),
        execution_id=uuid4(),
        current_state=CampaignState.IDLE,
    )
    
    assert payload.current_state == CampaignState.IDLE
    assert payload.retry_count == 0
    assert payload.max_retries == 3
    assert len(payload.execution_log) == 0
    
    print(f"✓ Campaign created: {payload.campaign_id}")
    return payload


def test_strategy_brief():
    """Test creating a strategy brief."""
    print("\nTesting StrategyBrief creation...")
    
    strategy = StrategyBrief(
        target_audience="Tech professionals 25-40",
        core_message="Innovation drives success",
        channels=["meta", "linkedin", "twitter"],
        budget_allocation={"meta": 0.5, "linkedin": 0.3, "twitter": 0.2},
        do_not_do=["No usar rojo", "No mencionar política"],
        tone_guard={"voice": "formal", "style": "minimal"},
        platform_constraints={"meta": {"aspect_ratio": "4:5"}},
    )
    
    assert len(strategy.channels) == 3
    assert strategy.target_audience == "Tech professionals 25-40"
    
    print(f"✓ Strategy created: {strategy.brief_id}")
    return strategy


def test_quality_report():
    """Test creating a quality report."""
    print("\nTesting QualityReport creation...")
    
    check = QualityCheck(
        check_id="contrast_ratio_check",
        result=QualityVerdict.FAIL,
        reason_code="CONTRAST_TOO_LOW",
        severity=Severity.CRITICAL,
        evidence={"actual": 3.1, "min_required": 4.5}
    )
    
    report = QualityReport(
        verdict=QualityVerdict.FAIL,
        checks=[check],
        auditor_signature="sha256:abc123...",
        timestamp=1702843200.0,
    )
    
    assert report.verdict == QualityVerdict.FAIL
    assert len(report.checks) == 1
    assert report.checks[0].severity == Severity.CRITICAL
    
    print(f"✓ Quality report created: {report.verdict.value}")
    return report


def test_trace_entries():
    """Test adding trace entries to payload."""
    print("\nTesting trace entries...")
    
    payload = CampaignPayload(
        campaign_id=uuid4(),
        tenant_id=uuid4(),
        execution_id=uuid4(),
        current_state=CampaignState.IDLE,
    )
    
    payload.add_trace("orchestrator", "campaign_created", {"source": "test"})
    payload.add_trace("radar_service", "scan_started")
    payload.add_trace("radar_service", "scan_completed", {"trends": 5})
    
    assert len(payload.execution_log) == 3
    assert payload.execution_log[0].actor_service == "orchestrator"
    assert payload.execution_log[2].metadata["trends"] == 5
    
    print(f"✓ Added {len(payload.execution_log)} trace entries")
    return payload


def test_failure_handling():
    """Test failure handling methods."""
    print("\nTesting failure handling...")
    
    payload = CampaignPayload(
        campaign_id=uuid4(),
        tenant_id=uuid4(),
        execution_id=uuid4(),
        current_state=CampaignState.QUALITY_AUDIT,
    )
    
    # Mark as failed
    payload.mark_failed(
        FailureReason.QUALITY_CHECK_FAILED,
        "Contrast ratio too low (3.1 vs required 4.5)"
    )
    
    assert payload.current_state == CampaignState.FAILED
    assert payload.terminal_reason == FailureReason.QUALITY_CHECK_FAILED
    assert payload.is_terminal()
    assert len(payload.execution_log) == 1  # mark_failed adds a trace
    
    print(f"✓ Campaign marked as failed: {payload.terminal_reason.value}")
    return payload


def test_serialization():
    """Test JSON serialization."""
    print("\nTesting JSON serialization...")
    
    payload = CampaignPayload(
        campaign_id=uuid4(),
        tenant_id=uuid4(),
        execution_id=uuid4(),
        current_state=CampaignState.IDLE,
    )
    
    # Serialize to dict
    data = payload.model_dump()
    assert "campaign_id" in data
    assert "current_state" in data
    
    # Serialize to JSON string
    json_str = payload.model_dump_json()
    assert isinstance(json_str, str)
    assert "IDLE" in json_str
    
    # Deserialize from dict
    payload2 = CampaignPayload(**data)
    assert payload2.campaign_id == payload.campaign_id
    
    print("✓ Serialization/deserialization working")


def main():
    """Run all tests."""
    print("=" * 60)
    print("LeadBoostAI Contracts Library - Verification Tests")
    print("=" * 60)
    
    try:
        test_campaign_payload()
        test_strategy_brief()
        test_quality_report()
        test_trace_entries()
        test_failure_handling()
        test_serialization()
        
        print("\n" + "=" * 60)
        print("✅ All tests passed! Contracts library is working correctly.")
        print("=" * 60)
        
    except Exception as e:
        print("\n" + "=" * 60)
        print(f"❌ Test failed: {str(e)}")
        print("=" * 60)
        raise


if __name__ == "__main__":
    main()
