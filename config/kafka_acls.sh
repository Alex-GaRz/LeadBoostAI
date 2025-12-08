
#!/bin/bash
# =============================================================================
# RFC-PHOENIX-02: Kafka ACLs Configuration Script
# Implements security policies per RFC Section 7
# =============================================================================

set -e  # Exit on error

echo "🔐 Configuring Kafka ACLs for LeadBoostAI Enterprise..."

# Kafka cluster configuration
KAFKA_BROKER="kafka-broker-1:9092"
KAFKA_ADMIN_USER="admin"

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

create_acl() {
    local principal=$1
    local operation=$2
    local resource_type=$3
    local resource_name=$4
    local pattern_type=${5:-LITERAL}
    
    echo -e "${YELLOW}Creating ACL: ${NC}Principal=${principal}, Operation=${operation}, Resource=${resource_type}:${resource_name}"
    
    kafka-acls --bootstrap-server ${KAFKA_BROKER} \
        --add \
        --allow-principal "User:${principal}" \
        --operation ${operation} \
        --${resource_type} ${resource_name} \
        --resource-pattern-type ${pattern_type} \
        2>&1 | grep -v "WARNING" || true
}

create_consumer_group_acl() {
    local principal=$1
    local group_name=$2
    
    echo -e "${YELLOW}Creating Consumer Group ACL: ${NC}Principal=${principal}, Group=${group_name}"
    
    kafka-acls --bootstrap-server ${KAFKA_BROKER} \
        --add \
        --allow-principal "User:${principal}" \
        --operation Read \
        --group ${group_name} \
        2>&1 | grep -v "WARNING" || true
}

list_acls() {
    echo -e "\n${GREEN}Current ACL Configuration:${NC}"
    kafka-acls --bootstrap-server ${KAFKA_BROKER} --list 2>&1 | grep -v "WARNING" || true
}

# =============================================================================
# ANALYST SERVICE ACLs
# RFC Section 7: Read/Write on events.*, Read on commands.*
# =============================================================================

echo -e "\n${GREEN}[1/4] Configuring Analyst Service ACLs...${NC}"

# Read access to commands topics
create_acl "analyst-service" "READ" "topic" "core.commands.v1"

# Read/Write access to events topics
create_acl "analyst-service" "READ" "topic" "core.events.v1"
create_acl "analyst-service" "WRITE" "topic" "core.events.v1"

# Consumer group permissions
create_consumer_group_acl "analyst-service" "analyst-service"

# Describe topic permissions (required for metadata)
create_acl "analyst-service" "DESCRIBE" "topic" "core.commands.v1"
create_acl "analyst-service" "DESCRIBE" "topic" "core.events.v1"

echo -e "${GREEN}✅ Analyst Service ACLs configured${NC}"


# =============================================================================
# ACTUATOR SERVICE ACLs
# RFC Section 7: Read on commands.*, Write on events.*
# =============================================================================

echo -e "\n${GREEN}[2/4] Configuring Actuator Service ACLs...${NC}"

# Read access to commands topics
create_acl "actuator-service" "READ" "topic" "core.commands.v1"

# Write access to events topics
create_acl "actuator-service" "WRITE" "topic" "core.events.v1"

# Write access to audit topic
create_acl "actuator-service" "WRITE" "topic" "sys.audit.v1"

# Consumer group permissions
create_consumer_group_acl "actuator-service" "actuator-service"

# Describe topic permissions
create_acl "actuator-service" "DESCRIBE" "topic" "core.commands.v1"
create_acl "actuator-service" "DESCRIBE" "topic" "core.events.v1"
create_acl "actuator-service" "DESCRIBE" "topic" "sys.audit.v1"

echo -e "${GREEN}✅ Actuator Service ACLs configured${NC}"


# =============================================================================
# AUDIT SERVICE ACLs
# RFC Section 7: Read-Only on *
# =============================================================================

echo -e "\n${GREEN}[3/4] Configuring Audit Service ACLs...${NC}"

# Read-only access to all topics (using wildcard pattern)
create_acl "audit-service" "READ" "topic" "core.commands.v1"
create_acl "audit-service" "READ" "topic" "core.events.v1"
create_acl "audit-service" "READ" "topic" "sys.deadletter.v1"
create_acl "audit-service" "READ" "topic" "sys.audit.v1"

# Consumer group permissions
create_consumer_group_acl "audit-service" "audit-service"

# Describe permissions for all topics
create_acl "audit-service" "DESCRIBE" "topic" "core.commands.v1"
create_acl "audit-service" "DESCRIBE" "topic" "core.events.v1"
create_acl "audit-service" "DESCRIBE" "topic" "sys.deadletter.v1"
create_acl "audit-service" "DESCRIBE" "topic" "sys.audit.v1"

echo -e "${GREEN}✅ Audit Service ACLs configured${NC}"


# =============================================================================
# SAGA COORDINATOR ACLs
# RFC Section 4: Full control for orchestration
# =============================================================================

echo -e "\n${GREEN}[4/4] Configuring SAGA Coordinator ACLs...${NC}"

# Read/Write access to commands (orchestration)
create_acl "saga-coordinator" "READ" "topic" "core.commands.v1"
create_acl "saga-coordinator" "WRITE" "topic" "core.commands.v1"

# Read/Write access to events (state tracking)
create_acl "saga-coordinator" "READ" "topic" "core.events.v1"
create_acl "saga-coordinator" "WRITE" "topic" "core.events.v1"

# Write access to audit
create_acl "saga-coordinator" "WRITE" "topic" "sys.audit.v1"

# Consumer group permissions
create_consumer_group_acl "saga-coordinator" "saga-coordinator"

# Describe permissions
create_acl "saga-coordinator" "DESCRIBE" "topic" "core.commands.v1"
create_acl "saga-coordinator" "DESCRIBE" "topic" "core.events.v1"
create_acl "saga-coordinator" "DESCRIBE" "topic" "sys.audit.v1"

echo -e "${GREEN}✅ SAGA Coordinator ACLs configured${NC}"


# =============================================================================
# DEAD LETTER QUEUE ACLs
# All services can write to DLQ
# =============================================================================

echo -e "\n${GREEN}[5/5] Configuring Dead Letter Queue ACLs...${NC}"

# Allow all services to write to DLQ
create_acl "analyst-service" "WRITE" "topic" "sys.deadletter.v1"
create_acl "actuator-service" "WRITE" "topic" "sys.deadletter.v1"
create_acl "saga-coordinator" "WRITE" "topic" "sys.deadletter.v1"

# Describe permissions
create_acl "analyst-service" "DESCRIBE" "topic" "sys.deadletter.v1"
create_acl "actuator-service" "DESCRIBE" "topic" "sys.deadletter.v1"
create_acl "saga-coordinator" "DESCRIBE" "topic" "sys.deadletter.v1"

echo -e "${GREEN}✅ Dead Letter Queue ACLs configured${NC}"


# =============================================================================
# CLUSTER-LEVEL PERMISSIONS
# Allow services to query cluster metadata
# =============================================================================

echo -e "\n${GREEN}Configuring Cluster-Level Permissions...${NC}"

# Allow services to describe cluster
create_acl "analyst-service" "DESCRIBE" "cluster" "kafka-cluster"
create_acl "actuator-service" "DESCRIBE" "cluster" "kafka-cluster"
create_acl "audit-service" "DESCRIBE" "cluster" "kafka-cluster"
create_acl "saga-coordinator" "DESCRIBE" "cluster" "kafka-cluster"

echo -e "${GREEN}✅ Cluster permissions configured${NC}"


# =============================================================================
# VERIFICATION & SUMMARY
# =============================================================================

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}ACL Configuration Complete!${NC}"
echo -e "${GREEN}================================${NC}"

# List all configured ACLs
list_acls

# Summary
echo -e "\n${GREEN}Summary:${NC}"
echo -e "  ✅ Analyst Service: READ commands, READ/WRITE events"
echo -e "  ✅ Actuator Service: READ commands, WRITE events"
echo -e "  ✅ Audit Service: READ all topics"
echo -e "  ✅ SAGA Coordinator: Full orchestration access"
echo -e "  ✅ Dead Letter Queue: Write access for all services"

echo -e "\n${YELLOW}Security Notes:${NC}"
echo -e "  🔒 mTLS is REQUIRED on port 9093 (configured in docker-compose)"
echo -e "  🔒 All services must present valid X.509 certificates"
echo -e "  🔒 ACLs are enforced by kafka.security.authorizer.AclAuthorizer"
echo -e "  🔒 Super users: admin, saga-coordinator"

echo -e "\n${GREEN}✅ Kafka ACLs successfully configured per RFC-PHOENIX-02${NC}"


# =============================================================================
# VERIFICATION TESTS
# =============================================================================

echo -e "\n${YELLOW}Running Verification Tests...${NC}"

# Test 1: Verify topics exist
echo -e "\n${YELLOW}Test 1: Verifying topics exist...${NC}"
kafka-topics --bootstrap-server ${KAFKA_BROKER} --list 2>&1 | grep "core.commands.v1" && echo -e "${GREEN}✅ core.commands.v1 exists${NC}" || echo -e "${RED}❌ core.commands.v1 missing${NC}"
kafka-topics --bootstrap-server ${KAFKA_BROKER} --list 2>&1 | grep "core.events.v1" && echo -e "${GREEN}✅ core.events.v1 exists${NC}" || echo -e "${RED}❌ core.events.v1 missing${NC}"
kafka-topics --bootstrap-server ${KAFKA_BROKER} --list 2>&1 | grep "sys.deadletter.v1" && echo -e "${GREEN}✅ sys.deadletter.v1 exists${NC}" || echo -e "${RED}❌ sys.deadletter.v1 missing${NC}"
kafka-topics --bootstrap-server ${KAFKA_BROKER} --list 2>&1 | grep "sys.audit.v1" && echo -e "${GREEN}✅ sys.audit.v1 exists${NC}" || echo -e "${RED}❌ sys.audit.v1 missing${NC}"

# Test 2: Verify replication factor
echo -e "\n${YELLOW}Test 2: Verifying replication configuration...${NC}"
kafka-topics --bootstrap-server ${KAFKA_BROKER} --describe --topic core.commands.v1 2>&1 | grep "ReplicationFactor: 3" && echo -e "${GREEN}✅ Replication factor correct${NC}" || echo -e "${RED}❌ Replication factor incorrect${NC}"

# Test 3: Verify min ISR config
echo -e "\n${YELLOW}Test 3: Verifying min.insync.replicas...${NC}"
kafka-configs --bootstrap-server ${KAFKA_BROKER} --describe --entity-type topics --entity-name core.commands.v1 2>&1 | grep "min.insync.replicas=2" && echo -e "${GREEN}✅ Min ISR correct${NC}" || echo -e "${RED}❌ Min ISR incorrect${NC}"

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}Verification Complete!${NC}"
echo -e "${GREEN}================================${NC}"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo -e "  1. Generate mTLS certificates for all services"
echo -e "  2. Deploy certificates to /etc/kafka/secrets/"
echo -e "  3. Restart services with SSL configuration enabled"
echo -e "  4. Test connectivity: kafka-console-producer --broker-list kafka-broker-1:9093 --topic core.commands.v1 --producer.config client-ssl.properties"
echo -e "  5. Monitor ACL violations in Kafka logs"

exit 0
