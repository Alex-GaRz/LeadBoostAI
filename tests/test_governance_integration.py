"""
Integration Validation Script
Tests HTTP communication between core_orchestrator and governance_engine.

This script validates:
1. ServiceClient sends complete CampaignPayload via model_dump(mode='json')
2. Governance API receives and deserializes the payload correctly
3. Audit executes and returns QualityReport
4. HTTP status codes are correct
"""

import asyncio
import logging
from uuid import uuid4
from datetime import datetime, timezone
from decimal import Decimal

# Import shared contracts
# FIX: Usamos TraceEntry que es el nombre correcto en el contrato actual
from contracts import (
    CampaignPayload,
    CampaignState,
    StrategyBrief,
    QualityVerdict,
    TraceEntry, 
)

# Import service client
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'core_orchestrator'))
from infrastructure.service_client import ServiceClient, ServiceClientError

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_test_payload() -> CampaignPayload:
    """Create a valid test campaign payload."""
    campaign_id = uuid4()
    tenant_id = uuid4()
    execution_id = uuid4()
    
    strategy = StrategyBrief(
        campaign_id=campaign_id,
        tenant_id=tenant_id,
        channels=["META", "GOOGLE"],
        target_audience="Test Audience",
        core_message="This is a compliant message. Terms apply.",
        budget_allocation={"META": 100.0, "GOOGLE": 100.0}, # Total 200 < 1000 limit
    )
    
    # Create logs
    logs = [
        TraceEntry(
            timestamp=datetime.now(timezone.utc),
            actor_service="test_script",
            action="init_test",
            metadata={"test_run": "integration_v1"}
        )
    ]
    
    return CampaignPayload(
        campaign_id=campaign_id,
        tenant_id=tenant_id,
        execution_id=execution_id,
        current_state=CampaignState.QUALITY_AUDIT,
        strategy=strategy,
        assets=[{"id": "asset_1", "type": "image", "url": "http://test.com/img.jpg"}],
        execution_log=logs
    )


async def test_payload_serialization():
    """Test 1: Validate payload serialization (Client Side)."""
    logger.info("--- Test 1: Payload Serialization ---")
    
    try:
        payload = create_test_payload()
        
        # Test serialization using the method ServiceClient uses
        data = payload.model_dump(mode='json')
        
        # Validation
        assert isinstance(data['campaign_id'], str), "UUIDs should be strings"
        assert isinstance(data['execution_log'][0]['timestamp'], str), "Dates should be ISO strings"
        assert 'strategy' in data, "Strategy should be present"
        assert data['strategy']['budget_allocation']['META'] == 100.0, "Budget should be preserved"
        
        logger.info("✅ Payload serialized correctly (JSON safe)")
        return True
    except Exception as e:
        logger.error(f"❌ Serialization failed: {str(e)}")
        return False


async def test_direct_http_call():
    """Test 2: Direct HTTP call to API (Server Side)."""
    logger.info("--- Test 2: Direct HTTP Call to Governance API ---")
    
    import httpx
    
    payload = create_test_payload()
    data = payload.model_dump(mode='json')
    
    url = "http://localhost:8000/api/v1/audit-quality"
    
    async with httpx.AsyncClient() as client:
        try:
            logger.info(f"POST {url}")
            response = await client.post(url, json=data)
            
            if response.status_code == 200:
                report = response.json()
                logger.info(f"✅ API responded 200 OK")
                logger.info(f"   Verdict: {report.get('verdict')}")
                logger.info(f"   Checks: {len(report.get('checks', []))}")
                return True
            else:
                logger.error(f"❌ API Error {response.status_code}: {response.text}")
                return False
                
        except httpx.ConnectError:
            logger.error("❌ Connection refused. Is microservice_optimizer running?")
            logger.error("   Run: python -m microservice_optimizer.main")
            return False
        except Exception as e:
            logger.error(f"❌ HTTP Test failed: {str(e)}")
            return False


async def test_service_client_integration():
    """Test 3: Full integration via ServiceClient wrapper."""
    logger.info("--- Test 3: ServiceClient Integration ---")
    
    client = ServiceClient(
        radar_url="http://mock-radar",
        analyst_url="http://mock-analyst",
        visual_url="http://mock-visual",
        optimizer_url="http://localhost:8000" # Real service
    )
    
    try:
        payload = create_test_payload()
        
        # This calls call_quality_audit -> _post -> http call
        logger.info("Invoking ServiceClient.call_quality_audit()...")
        report = await client.call_quality_audit(payload)
        
        logger.info(f"✅ ServiceClient returned QualityReport object")
        logger.info(f"   Verdict: {report.verdict}")
        logger.info(f"   Signature: {report.auditor_signature}")
        
        return True
    except Exception as e:
        logger.error(f"❌ ServiceClient failed: {str(e)}")
        return False
    finally:
        await client.close()


async def main():
    """Run all integration tests."""
    logger.info("\n🚀 Starting Integration Validation")
    logger.info("=" * 80)
    
    results = []
    
    # Test 1: Payload serialization (no server needed)
    result1 = await test_payload_serialization()
    results.append(("Payload Serialization", result1))
    
    # Test 2: Direct HTTP call (requires server)
    result2 = await test_direct_http_call()
    results.append(("Direct HTTP Call", result2))
    
    # Test 3: ServiceClient integration (requires server)
    result3 = await test_service_client_integration()
    results.append(("ServiceClient Integration", result3))
    
    # Summary
    logger.info("\n" + "=" * 80)
    logger.info("TEST SUMMARY")
    logger.info("=" * 80)
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        logger.info(f"{status}: {test_name}")
    
    all_passed = all(result for _, result in results)
    if all_passed:
        logger.info("\n🎉 INTEGRATION SUCCESSFUL: Core Orchestrator <-> Governance Engine")
    else:
        logger.info("\n💥 INTEGRATION FAILED: Check logs above")

if __name__ == "__main__":
    asyncio.run(main())