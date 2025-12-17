"""
Security Patches Verification Script
Run after applying security patches to verify implementation.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

def check_idempotency_store_patches():
    """Verify distributed lock methods exist in IdempotencyStore."""
    print("\n[1/4] Checking IdempotencyStore patches...")
    
    try:
        from infrastructure.idempotency import IdempotencyStore
        
        required_methods = [
            'acquire_lock',
            'release_lock', 
            'is_workflow_processed',
            'mark_workflow_processed',
            'get_cached_payload',
        ]
        
        for method in required_methods:
            if not hasattr(IdempotencyStore, method):
                print(f"  ❌ Missing method: {method}")
                return False
            print(f"  ✓ Method exists: {method}")
        
        print("  ✅ IdempotencyStore patches verified")
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


def check_fsm_patches():
    """Verify execute_workflow has distributed lock implementation."""
    print("\n[2/4] Checking OrchestratorFSM patches...")
    
    try:
        from domain.fsm import OrchestratorFSM
        import inspect
        
        # Get source code of execute_workflow
        source = inspect.getsource(OrchestratorFSM.execute_workflow)
        
        required_patterns = [
            'acquire_lock',
            'is_workflow_processed',
            'mark_workflow_processed',
            'release_lock',
            'finally:',  # Ensures lock is released
        ]
        
        for pattern in required_patterns:
            if pattern not in source:
                print(f"  ❌ Missing pattern: {pattern}")
                return False
            print(f"  ✓ Pattern found: {pattern}")
        
        print("  ✅ OrchestratorFSM patches verified")
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


def check_service_client_patches():
    """Verify ServiceClient has retry logic."""
    print("\n[3/4] Checking ServiceClient patches...")
    
    try:
        from infrastructure.service_client import ServiceClient
        import inspect
        
        # Check __init__ signature
        init_sig = inspect.signature(ServiceClient.__init__)
        if 'max_retries' not in init_sig.parameters:
            print("  ❌ Missing parameter: max_retries")
            return False
        if 'backoff_base' not in init_sig.parameters:
            print("  ❌ Missing parameter: backoff_base")
            return False
        print("  ✓ Constructor has max_retries and backoff_base")
        
        # Check _post has retry loop
        post_source = inspect.getsource(ServiceClient._post)
        
        required_patterns = [
            'for attempt in range',
            'exponential backoff',
            'HTTPStatusError',
            'RequestError',
            'asyncio.sleep',
        ]
        
        for pattern in required_patterns:
            if pattern not in post_source:
                print(f"  ❌ Missing pattern: {pattern}")
                return False
            print(f"  ✓ Pattern found: {pattern}")
        
        print("  ✅ ServiceClient patches verified")
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


def check_cors_patches():
    """Verify CORS restrictions in main.py."""
    print("\n[4/4] Checking CORS security patches...")
    
    try:
        # Read main.py directly (can't import due to app initialization)
        main_path = Path(__file__).parent / "app" / "main.py"
        with open(main_path, 'r') as f:
            source = f.read()
        
        # Check that wildcard is NOT present
        if 'allow_origins=["*"]' in source:
            print("  ❌ SECURITY RISK: Wildcard CORS still present!")
            return False
        print("  ✓ Wildcard CORS removed")
        
        # Check that restricted origins are used
        required_patterns = [
            'os.getenv',
            'CORS_ALLOWED_ORIGINS',
            'split(",")',
            'allow_origins=allowed_origins',
        ]
        
        for pattern in required_patterns:
            if pattern not in source:
                print(f"  ❌ Missing pattern: {pattern}")
                return False
            print(f"  ✓ Pattern found: {pattern}")
        
        print("  ✅ CORS security patches verified")
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


def main():
    """Run all verification checks."""
    print("=" * 70)
    print("SECURITY PATCHES VERIFICATION")
    print("=" * 70)
    
    results = [
        check_idempotency_store_patches(),
        check_fsm_patches(),
        check_service_client_patches(),
        check_cors_patches(),
    ]
    
    print("\n" + "=" * 70)
    
    if all(results):
        print("✅ ALL SECURITY PATCHES VERIFIED SUCCESSFULLY")
        print("=" * 70)
        print("\nNext steps:")
        print("1. Update .env with CORS_ALLOWED_ORIGINS")
        print("2. Test distributed lock with Redis")
        print("3. Simulate network failures for retry testing")
        print("4. Deploy to staging for integration tests")
        return 0
    else:
        print("❌ SOME PATCHES FAILED VERIFICATION")
        print("=" * 70)
        print("\nPlease review the errors above and reapply patches.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
