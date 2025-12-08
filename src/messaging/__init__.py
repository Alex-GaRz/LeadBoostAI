"""
Messaging package initialization.

Important:
Do NOT import health.py here.

Importing health.py at package load-time causes Prometheus
metrics to be registered globally before tests run, leading
to duplicated timeseries errors during unit testing.

Health monitoring must be imported explicitly by the
service entrypoints, NOT automatically here.
"""

# Expose ONLY the messaging core components
# (producers, consumers, envelopes, saga adapters, etc.)

__all__ = [
    "producer",
    "consumer",
    "message_envelope",
    "messaging_saga_adapter",
]
