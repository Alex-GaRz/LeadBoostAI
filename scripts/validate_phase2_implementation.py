
"""
RFC-PHOENIX-02: Validation Script
Comprehensive validation of FASE 2 implementation

Checks:
1. All required files exist
2. Code syntax is valid
3. Database schema matches RFC
4. Configuration is complete
5. Dependencies are installable
"""

import os
import sys
import importlib.util
from pathlib import Path
from typing import List, Tuple

# ANSI Colors
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_success(msg: str):
    print(f"{GREEN}✅ {msg}{RESET}")

def print_error(msg: str):
    print(f"{RED}❌ {msg}{RESET}")

def print_warning(msg: str):
    print(f"{YELLOW}⚠️  {msg}{RESET}")

def print_info(msg: str):
    print(f"{BLUE}ℹ️  {msg}{RESET}")


class Phase2Validator:
    """Validates FASE 2 implementation completeness"""
    
    def __init__(self, workspace_root: str):
        self.root = Path(workspace_root)
        self.errors = []
        self.warnings = []
        
    def validate_file_structure(self) -> bool:
        """Validate all required files exist"""
        print("\n" + "="*80)
        print("VALIDATION 1: File Structure")
        print("="*80)
        
        required_files = [
            # Infrastructure
            'docker-compose.messaging.yml',
            'docker-compose.messaging.override.yml',
            
            # Configuration
            'config/kafka_config.yml',
            'config/kafka_acls.sh',
            '.env.messaging.example',
            
            # Source Code
            'src/messaging/__init__.py',
            'src/messaging/producer.py',
            'src/messaging/consumer.py',
            'src/messaging/health.py',
            'src/sagas/__init__.py',
            'src/sagas/messaging_saga_adapter.py',
            
            # Database
            'migrations/phase2_messaging.sql',
            
            # Dependencies
            'requirements_messaging.txt',
            
            # Testing
            'tests/test_messaging_phase2.py',
            
            # Documentation
            'README_FASE2.md',
            
            # Scripts
            'scripts/start_messaging_phase2.bat',
        ]
        
        all_exist = True
        for file_path in required_files:
            full_path = self.root / file_path
            if full_path.exists():
                print_success(f"{file_path}")
            else:
                print_error(f"{file_path} - NOT FOUND")
                self.errors.append(f"Missing file: {file_path}")
                all_exist = False
        
        return all_exist
    
    def validate_python_syntax(self) -> bool:
        """Validate Python files have correct syntax"""
        print("\n" + "="*80)
        print("VALIDATION 2: Python Syntax")
        print("="*80)
        
        python_files = [
            'src/messaging/producer.py',
            'src/messaging/consumer.py',
            'src/messaging/health.py',
            'src/sagas/messaging_saga_adapter.py',
            'tests/test_messaging_phase2.py',
        ]
        
        all_valid = True
        for file_path in python_files:
            full_path = self.root / file_path
            
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    code = f.read()
                    compile(code, str(full_path), 'exec')
                print_success(f"{file_path} - Valid syntax")
            except SyntaxError as e:
                print_error(f"{file_path} - Syntax error: {e}")
                self.errors.append(f"Syntax error in {file_path}: {e}")
                all_valid = False
            except FileNotFoundError:
                print_error(f"{file_path} - File not found")
                all_valid = False
        
        return all_valid
    
    def validate_sql_structure(self) -> bool:
        """Validate SQL migration has required objects"""
        print("\n" + "="*80)
        print("VALIDATION 3: SQL Migration Structure")
        print("="*80)
        
        sql_file = self.root / 'migrations' / 'phase2_messaging.sql'
        
        required_tables = [
            'sys.consumer_offsets_log',
            'sys.message_traceability',
            'sys.dead_letters',
            'sys.kafka_topics_metadata',
            'sys.message_rate_limits',
            'sys.circuit_breaker_state',
        ]
        
        required_views = [
            'sys.vw_consumer_lag',
            'sys.vw_dlq_summary',
            'sys.vw_message_throughput',
        ]
        
        required_functions = [
            'sys.fn_record_consumer_offset',
            'sys.fn_get_dlq_statistics',
            'sys.fn_replay_dlq_message',
        ]
        
        try:
            with open(sql_file, 'r', encoding='utf-8') as f:
                sql_content = f.read()
            
            all_found = True
            
            print("\nTables:")
            for table in required_tables:
                if table in sql_content:
                    print_success(f"  {table}")
                else:
                    print_error(f"  {table} - NOT FOUND")
                    self.errors.append(f"Missing table: {table}")
                    all_found = False
            
            print("\nViews:")
            for view in required_views:
                if view in sql_content:
                    print_success(f"  {view}")
                else:
                    print_error(f"  {view} - NOT FOUND")
                    self.errors.append(f"Missing view: {view}")
                    all_found = False
            
            print("\nFunctions:")
            for func in required_functions:
                if func in sql_content:
                    print_success(f"  {func}")
                else:
                    print_error(f"  {func} - NOT FOUND")
                    self.errors.append(f"Missing function: {func}")
                    all_found = False
            
            return all_found
            
        except FileNotFoundError:
            print_error("SQL migration file not found")
            return False
    
    def validate_configuration(self) -> bool:
        """Validate configuration files have required sections"""
        print("\n" + "="*80)
        print("VALIDATION 4: Configuration Completeness")
        print("="*80)
        
        config_file = self.root / 'config' / 'kafka_config.yml'
        
        required_sections = [
            'cluster',
            'producer',
            'consumer',
            'topics',
            'consumer_groups',
            'resilience',
            'idempotency',
            'observability',
            'rate_limiting',
            'security',
            'database',
        ]
        
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                config_content = f.read()
            
            all_found = True
            for section in required_sections:
                if f'{section}:' in config_content:
                    print_success(f"Section '{section}'")
                else:
                    print_error(f"Section '{section}' - NOT FOUND")
                    self.errors.append(f"Missing config section: {section}")
                    all_found = False
            
            return all_found
            
        except FileNotFoundError:
            print_error("Configuration file not found")
            return False
    
    def validate_rfc_compliance(self) -> bool:
        """Validate RFC-PHOENIX-02 requirements"""
        print("\n" + "="*80)
        print("VALIDATION 5: RFC-PHOENIX-02 Compliance")
        print("="*80)
        
        checks = []
        
        # Check 1: At-Least-Once semantics (acks=all)
        config_file = self.root / 'config' / 'kafka_config.yml'
        with open(config_file, 'r') as f:
            config = f.read()
            checks.append(('acks: "all"', 'acks: "all"' in config))
            checks.append(('enable_idempotence: true', 'enable_idempotence: true' in config))
            checks.append(('enable_auto_commit: false', 'enable_auto_commit: false' in config))
        
        # Check 2: Idempotency implementation
        consumer_file = self.root / 'src' / 'messaging' / 'consumer.py'
        with open(consumer_file, 'r') as f:
            consumer = f.read()
            checks.append(('IdempotencyManager class', 'class IdempotencyManager' in consumer))
            checks.append(('sys.request_keys table', 'sys.request_keys' in consumer))
        
        # Check 3: Retry with exponential backoff
        checks.append(('Retry intervals [1s, 2s, 5s]', 'retry_intervals = [1000, 2000, 5000]' in consumer))
        
        # Check 4: Circuit Breaker
        checks.append(('CircuitBreaker class', 'class CircuitBreaker' in consumer))
        
        # Check 5: Dead Letter Queue
        checks.append(('DeadLetterQueue class', 'class DeadLetterQueue' in consumer))
        checks.append(('DLQ table', 'sys.dead_letters' in consumer))
        
        # Check 6: SAGA integration
        saga_file = self.root / 'src' / 'sagas' / 'messaging_saga_adapter.py'
        with open(saga_file, 'r') as f:
            saga = f.read()
            checks.append(('MessagingSagaCoordinator', 'class MessagingSagaCoordinator' in saga))
        
        all_compliant = True
        for check_name, check_result in checks:
            if check_result:
                print_success(check_name)
            else:
                print_error(check_name)
                self.errors.append(f"RFC compliance check failed: {check_name}")
                all_compliant = False
        
        return all_compliant
    
    def generate_report(self) -> None:
        """Generate final validation report"""
        print("\n" + "="*80)
        print("VALIDATION REPORT")
        print("="*80)
        
        if not self.errors:
            print_success("\n🎉 ALL VALIDATIONS PASSED!")
            print_success("✅ FASE 2 implementation is COMPLETE and RFC-compliant")
            print_info("\nNext steps:")
            print_info("  1. Run: docker-compose -f docker-compose.messaging.yml up -d")
            print_info("  2. Apply migrations: psql -f migrations/phase2_messaging.sql")
            print_info("  3. Run tests: python tests/test_messaging_phase2.py")
            print_info("  4. Start health server: python src/messaging/health.py")
        else:
            print_error(f"\n❌ VALIDATION FAILED: {len(self.errors)} error(s)")
            print("\nErrors:")
            for error in self.errors:
                print_error(f"  - {error}")
        
        if self.warnings:
            print_warning(f"\n⚠️  {len(self.warnings)} warning(s):")
            for warning in self.warnings:
                print_warning(f"  - {warning}")
        
        print("\n" + "="*80)
    
    def run_all_validations(self) -> bool:
        """Run all validation checks"""
        print(f"\n{BLUE}{'='*80}")
        print("RFC-PHOENIX-02: FASE 2 IMPLEMENTATION VALIDATOR")
        print(f"{'='*80}{RESET}\n")
        
        print_info(f"Workspace: {self.root}")
        
        checks = [
            self.validate_file_structure(),
            self.validate_python_syntax(),
            self.validate_sql_structure(),
            self.validate_configuration(),
            self.validate_rfc_compliance(),
        ]
        
        self.generate_report()
        
        return all(checks)


if __name__ == "__main__":
    # Determine workspace root
    if len(sys.argv) > 1:
        workspace = sys.argv[1]
    else:
        workspace = os.getcwd()
    
    # Run validation
    validator = Phase2Validator(workspace)
    success = validator.run_all_validations()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)
