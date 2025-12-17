"""
Simple test to verify orchestrator imports and initialization.
Run after installing shared_lib.
"""

import sys
from pathlib import Path

# Add parent directory to path for development
sys.path.insert(0, str(Path(__file__).parent))

try:
    from app.config import settings
    from infrastructure.service_client import ServiceClient
    from infrastructure.idempotency import IdempotencyStore
    from domain.fsm import OrchestratorFSM
    from contracts import CampaignPayload, CampaignState
    from uuid import uuid4
    
    print("=" * 60)
    print("Core Orchestrator - Import Verification")
    print("=" * 60)
    
    # Test configuration
    print(f"\n✓ Settings loaded: {settings.app_name} v{settings.app_version}")
    print(f"  - Radar URL: {settings.service_radar_url}")
    print(f"  - Visual URL: {settings.service_visual_url}")
    
    # Test service client initialization
    client = ServiceClient(
        radar_url=settings.service_radar_url,
        analyst_url=settings.service_analyst_url,
        visual_url=settings.service_visual_url,
        optimizer_url=settings.service_optimizer_url,
        timeout=settings.service_timeout,
    )
    print("\n✓ ServiceClient initialized")
    
    # Test idempotency store
    store = IdempotencyStore(use_in_memory=True)
    print("✓ IdempotencyStore initialized (in-memory mode)")
    
    # Test payload creation
    payload = CampaignPayload(
        campaign_id=uuid4(),
        tenant_id=uuid4(),
        execution_id=uuid4(),
        current_state=CampaignState.IDLE,
    )
    print(f"✓ CampaignPayload created: {payload.campaign_id}")
    
    # Test FSM initialization
    fsm = OrchestratorFSM(
        payload=payload,
        service_client=client,
        idempotency_store=store,
    )
    print(f"✓ OrchestratorFSM initialized in state: {fsm.state}")
    
    # Verify FSM transitions are configured
    transitions = fsm.machine.get_transitions()
    print(f"✓ FSM has {len(transitions)} transitions configured")
    
    print("\n" + "=" * 60)
    print("✅ All imports successful! Orchestrator is ready.")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Configure .env with actual service URLs")
    print("2. Start the orchestrator: uvicorn app.main:app --reload")
    print("3. Access API docs at: http://localhost:8000/docs")
    
except ImportError as e:
    print("\n" + "=" * 60)
    print(f"❌ Import error: {str(e)}")
    print("=" * 60)
    print("\nMake sure you've installed the shared_lib:")
    print("  cd shared_lib")
    print("  pip install -e .")
    sys.exit(1)
    
except Exception as e:
    print("\n" + "=" * 60)
    print(f"❌ Error: {str(e)}")
    print("=" * 60)
    import traceback
    traceback.print_exc()
    sys.exit(1)
