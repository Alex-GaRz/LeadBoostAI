
"""
RFC-PHOENIX-02: Kafka Producer Implementation
At-Least-Once Semantics with Idempotent Publishing

Enterprise-grade message producer with:
- acks=all for durability
- Automatic retries with exponential backoff
- Message partitioning by tenant_id
- Rate limiting per tenant
- Observability hooks
"""

import json
import uuid
import hashlib
import time
from typing import Dict, Any, Optional, List
from datetime import datetime
from dataclasses import dataclass, asdict
from enum import Enum

import yaml
from confluent_kafka import Producer, KafkaError, KafkaException
from confluent_kafka.admin import AdminClient, NewTopic
import redis
from prometheus_client import Counter, Histogram, Gauge

# Metrics
MESSAGES_PRODUCED = Counter(
    'kafka_messages_produced_total',
    'Total messages produced to Kafka',
    ['topic', 'status']
)
PRODUCE_LATENCY = Histogram(
    'kafka_produce_latency_seconds',
    'Latency of produce operations',
    ['topic']
)
RATE_LIMIT_HITS = Counter(
    'kafka_rate_limit_hits_total',
    'Total rate limit violations',
    ['tenant_id']
)


class MessageType(Enum):
    """Message type enumeration per RFC"""
    COMMAND = "core.commands.v1"
    EVENT = "core.events.v1"
    AUDIT = "sys.audit.v1"


@dataclass
class MessageEnvelope:
    """
    Standard message envelope for all Kafka messages
    Ensures traceability and correlation per RFC Section 6
    """
    message_id: str
    message_type: str
    tenant_id: str
    correlation_id: Optional[str]
    causation_id: Optional[str]
    timestamp: str
    payload: Dict[str, Any]
    metadata: Dict[str, Any]
    
    @classmethod
    def create(
        cls,
        message_type: str,
        tenant_id: str,
        payload: Dict[str, Any],
        correlation_id: Optional[str] = None,
        causation_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> 'MessageEnvelope':
        """Factory method to create a message envelope"""
        return cls(
            message_id=str(uuid.uuid4()),
            message_type=message_type,
            tenant_id=tenant_id,
            correlation_id=correlation_id or str(uuid.uuid4()),
            causation_id=causation_id,
            timestamp=datetime.utcnow().isoformat() + 'Z',
            payload=payload,
            metadata=metadata or {}
        )
    
    def to_json(self) -> str:
        """Serialize to JSON"""
        return json.dumps(asdict(self), ensure_ascii=False)
    
    def to_bytes(self) -> bytes:
        """Serialize to bytes for Kafka"""
        return self.to_json().encode('utf-8')


class RateLimiter:
    """
    Token Bucket rate limiter using Redis
    Implements RFC Section 5.3
    """
    
    def __init__(self, redis_client: redis.Redis, rate: int, burst: int):
        self.redis = redis_client
        self.rate = rate  # tokens per second
        self.burst = burst  # max bucket size
        
    def allow(self, tenant_id: str) -> bool:
        """
        Check if request is allowed under rate limit
        Returns True if allowed, False if rate limited
        """
        key = f"rate_limit:tenant:{tenant_id}"
        now = time.time()
        
        # Lua script for atomic token bucket check
        script = """
        local key = KEYS[1]
        local rate = tonumber(ARGV[1])
        local burst = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        
        local bucket = redis.call('HMGET', key, 'tokens', 'last_update')
        local tokens = tonumber(bucket[1]) or burst
        local last_update = tonumber(bucket[2]) or now
        
        local elapsed = now - last_update
        tokens = math.min(burst, tokens + elapsed * rate)
        
        if tokens >= 1 then
            tokens = tokens - 1
            redis.call('HMSET', key, 'tokens', tokens, 'last_update', now)
            redis.call('EXPIRE', key, 60)
            return 1
        else
            return 0
        end
        """
        
        try:
            result = self.redis.eval(script, 1, key, self.rate, self.burst, now)
            allowed = bool(result)
            
            if not allowed:
                RATE_LIMIT_HITS.labels(tenant_id=tenant_id).inc()
                
            return allowed
        except redis.RedisError as e:
            # Fail open on Redis errors (don't block traffic)
            print(f"⚠️ Rate limiter Redis error: {e}. Allowing request.")
            return True


class KafkaProducerClient:
    """
    Enterprise Kafka Producer with At-Least-Once guarantees
    Implements RFC-PHOENIX-02 Section 3.1
    """
    
    def __init__(self, config_path: str = "config/kafka_config.yml"):
        self.config = self._load_config(config_path)
        self.producer = self._create_producer()
        self.rate_limiter = self._create_rate_limiter()
        self.delivery_reports: List[Dict[str, Any]] = []
        
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load Kafka configuration from YAML"""
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
    
    def _create_producer(self) -> Producer:
        """Create Kafka producer with RFC-compliant configuration"""
        producer_config = self.config['producer']
        cluster_config = self.config['cluster']
        
        kafka_config = {
            'bootstrap.servers': ','.join(cluster_config['bootstrap_servers']),
            'acks': producer_config['acks'],
            'retries': producer_config['retries'],
            'max.in.flight.requests.per.connection': producer_config['max_in_flight_requests_per_connection'],
            'enable.idempotence': producer_config['enable_idempotence'],
            'compression.type': producer_config['compression_type'],
            'batch.size': producer_config['batch_size'],
            'linger.ms': producer_config['linger_ms'],
            'buffer.memory': producer_config['buffer_memory'],
            'request.timeout.ms': producer_config['request_timeout_ms'],
            'delivery.timeout.ms': producer_config['delivery_timeout_ms'],
        }
        
        # Add mTLS configuration if enabled
        security_config = self.config.get('security', {})
        if security_config.get('mtls', {}).get('enabled', False):
            kafka_config.update({
                'security.protocol': producer_config['security_protocol'],
                'ssl.ca.location': producer_config['ssl_ca_location'],
                'ssl.certificate.location': producer_config['ssl_cert_location'],
                'ssl.key.location': producer_config['ssl_key_location'],
            })
        
        return Producer(kafka_config)
    
    def _create_rate_limiter(self) -> Optional[RateLimiter]:
        """Create rate limiter if enabled"""
        rate_limit_config = self.config.get('rate_limiting', {})
        
        if not rate_limit_config.get('enabled', False):
            return None
        
        redis_url = rate_limit_config['redis_url']
        redis_client = redis.from_url(redis_url, decode_responses=False)
        
        limits = rate_limit_config['limits']['per_tenant']
        return RateLimiter(
            redis_client=redis_client,
            rate=limits['messages_per_second'],
            burst=limits['burst_size']
        )
    
    def _delivery_callback(self, err: Optional[KafkaError], msg) -> None:
        """
        Delivery report callback
        Called once for each produced message to indicate delivery result
        """
        if err is not None:
            error_report = {
                'status': 'error',
                'topic': msg.topic(),
                'partition': msg.partition(),
                'offset': msg.offset(),
                'error': str(err),
                'timestamp': datetime.utcnow().isoformat()
            }
            self.delivery_reports.append(error_report)
            MESSAGES_PRODUCED.labels(topic=msg.topic(), status='error').inc()
            print(f"❌ Message delivery failed: {err}")
        else:
            success_report = {
                'status': 'success',
                'topic': msg.topic(),
                'partition': msg.partition(),
                'offset': msg.offset(),
                'timestamp': datetime.utcnow().isoformat()
            }
            self.delivery_reports.append(success_report)
            MESSAGES_PRODUCED.labels(topic=msg.topic(), status='success').inc()
    
    def produce_message(
        self,
        topic: str,
        message_envelope: MessageEnvelope,
        headers: Optional[Dict[str, str]] = None
    ) -> bool:
        """
        Produce a message to Kafka with at-least-once semantics
        
        Args:
            topic: Target Kafka topic
            message_envelope: Message envelope with payload
            headers: Optional message headers
            
        Returns:
            True if message was accepted (queued), False otherwise
        """
        start_time = time.time()
        
        try:
            # Rate limiting check
            if self.rate_limiter:
                if not self.rate_limiter.allow(message_envelope.tenant_id):
                    print(f"⚠️ Rate limit exceeded for tenant {message_envelope.tenant_id}")
                    return False
            
            # Prepare headers
            kafka_headers = {
                'Message-ID': message_envelope.message_id,
                'Correlation-ID': message_envelope.correlation_id or '',
                'Tenant-ID': message_envelope.tenant_id,
                'Timestamp': message_envelope.timestamp,
            }
            
            if message_envelope.causation_id:
                kafka_headers['Causation-ID'] = message_envelope.causation_id
            
            if headers:
                kafka_headers.update(headers)
            
            # Convert headers to list of tuples (Kafka format)
            kafka_headers_list = [(k, v.encode('utf-8')) for k, v in kafka_headers.items()]
            
            # Produce message
            self.producer.produce(
                topic=topic,
                key=message_envelope.tenant_id.encode('utf-8'),  # Partition by tenant_id
                value=message_envelope.to_bytes(),
                headers=kafka_headers_list,
                on_delivery=self._delivery_callback
            )
            
            # Poll for delivery reports (non-blocking)
            self.producer.poll(0)
            
            # Record metrics
            latency = time.time() - start_time
            PRODUCE_LATENCY.labels(topic=topic).observe(latency)
            
            return True
            
        except BufferError as e:
            print(f"❌ Producer buffer full: {e}")
            MESSAGES_PRODUCED.labels(topic=topic, status='buffer_full').inc()
            return False
            
        except KafkaException as e:
            print(f"❌ Kafka exception: {e}")
            MESSAGES_PRODUCED.labels(topic=topic, status='exception').inc()
            return False
    
    def produce_command(
        self,
        tenant_id: str,
        command_type: str,
        payload: Dict[str, Any],
        correlation_id: Optional[str] = None
    ) -> bool:
        """
        Produce a command message to core.commands.v1
        Commands are imperative instructions (e.g., "execute_campaign")
        """
        envelope = MessageEnvelope.create(
            message_type=command_type,
            tenant_id=tenant_id,
            payload=payload,
            correlation_id=correlation_id,
            metadata={'command_type': command_type}
        )
        
        topic = self.config['topics']['commands']['name']
        return self.produce_message(topic, envelope)
    
    def produce_event(
        self,
        tenant_id: str,
        event_type: str,
        payload: Dict[str, Any],
        correlation_id: Optional[str] = None,
        causation_id: Optional[str] = None
    ) -> bool:
        """
        Produce a domain event to core.events.v1
        Events are facts that have occurred (e.g., "campaign_created")
        """
        envelope = MessageEnvelope.create(
            message_type=event_type,
            tenant_id=tenant_id,
            payload=payload,
            correlation_id=correlation_id,
            causation_id=causation_id,
            metadata={'event_type': event_type}
        )
        
        topic = self.config['topics']['events']['name']
        return self.produce_message(topic, envelope)
    
    def produce_audit_event(
        self,
        trace_id: str,
        audit_type: str,
        payload: Dict[str, Any]
    ) -> bool:
        """
        Produce an audit event to sys.audit.v1
        Audit events are for compliance and forensic analysis
        """
        envelope = MessageEnvelope.create(
            message_type=audit_type,
            tenant_id='SYSTEM',
            payload=payload,
            correlation_id=trace_id,
            metadata={'audit_type': audit_type}
        )
        
        topic = self.config['topics']['audit']['name']
        return self.produce_message(topic, envelope)
    
    def flush(self, timeout: float = 30.0) -> int:
        """
        Wait for all messages in the Producer queue to be delivered
        
        Args:
            timeout: Maximum time to wait in seconds
            
        Returns:
            Number of messages still in queue after timeout
        """
        remaining = self.producer.flush(timeout)
        
        if remaining > 0:
            print(f"⚠️ {remaining} messages still in queue after flush timeout")
        
        return remaining
    
    def close(self) -> None:
        """Close producer and flush all pending messages"""
        print("📤 Flushing producer queue...")
        remaining = self.flush(timeout=30.0)
        
        if remaining == 0:
            print("✅ All messages delivered successfully")
        else:
            print(f"⚠️ {remaining} messages failed to deliver")
    
    def get_delivery_reports(self) -> List[Dict[str, Any]]:
        """Get all delivery reports"""
        return self.delivery_reports.copy()


# Singleton instance for application-wide use
_producer_instance: Optional[KafkaProducerClient] = None


def get_producer(config_path: str = "config/kafka_config.yml") -> KafkaProducerClient:
    """Get or create the singleton producer instance"""
    global _producer_instance
    
    if _producer_instance is None:
        _producer_instance = KafkaProducerClient(config_path)
    
    return _producer_instance


if __name__ == "__main__":
    """Example usage and testing"""
    
    print("🚀 Initializing Kafka Producer...")
    producer = get_producer()
    
    # Example: Produce a command
    success = producer.produce_command(
        tenant_id="tenant-123",
        command_type="ExecuteCampaign",
        payload={
            "campaign_id": "camp-456",
            "budget": 1000.00,
            "target_audience": "tech_enthusiasts"
        }
    )
    
    if success:
        print("✅ Command produced successfully")
    else:
        print("❌ Failed to produce command")
    
    # Example: Produce an event
    success = producer.produce_event(
        tenant_id="tenant-123",
        event_type="CampaignCreated",
        payload={
            "campaign_id": "camp-456",
            "status": "ACTIVE"
        }
    )
    
    if success:
        print("✅ Event produced successfully")
    else:
        print("❌ Failed to produce event")
    
    # Flush and close
    producer.close()
    
    # Show delivery reports
    reports = producer.get_delivery_reports()
    print(f"\n📊 Delivery Reports: {len(reports)} messages")
    for report in reports:
        print(f"  - {report['status']}: {report['topic']} (offset: {report.get('offset', 'N/A')})")
