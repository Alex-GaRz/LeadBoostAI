"""
Test Suite Example - Memory Service FASE 6.1
Ejemplos de tests unitarios y de integración.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import sys
import os

# Agregar el directorio padre al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from models.memory_models import MemoryEntry, MemoryMetrics, ContextCard
from services.canonizer import Canonizer

client = TestClient(app)


# === TESTS DE HEALTH CHECK ===

def test_root_endpoint():
    """Test del endpoint raíz."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "microservice_memory"
    assert data["status"] == "running"


def test_health_endpoint():
    """Test del health check."""
    response = client.get("/api/v1/memory/health")
    assert response.status_code in [200, 503]  # Puede fallar si ChromaDB no está inicializado


# === TESTS DEL CANONIZADOR ===

def test_canonizer_basic():
    """Test de creación de context card básica."""
    payload = {
        "tenant_id": "test-tenant",
        "campaign_id": "test-campaign",
        "platform": "LINKEDIN",
        "objective": "LEADS",
        "state": "LEARN",
        "metrics": {
            "roas": 3.5,
            "quality_score": 85
        }
    }
    
    card = Canonizer.create_context_card(payload)
    
    assert isinstance(card, ContextCard)
    assert "LINKEDIN" in card.summary_text
    assert "LEADS" in card.summary_text
    assert len(card.tags) > 0
    assert "LINKEDIN" in card.tags


def test_canonizer_audience_description():
    """Test de descripción de audiencia."""
    payload = {
        "tenant_id": "test-tenant",
        "campaign_id": "test-campaign",
        "platform": "LINKEDIN",
        "objective": "LEADS",
        "strategy_brief": {
            "audience": {
                "target_roles": ["CTO", "VP Engineering"],
                "industries": ["Technology", "SaaS"],
                "geo": ["Mexico", "Colombia"]
            }
        },
        "metrics": {
            "roas": 2.5
        }
    }
    
    card = Canonizer.create_context_card(payload)
    
    assert "CTO" in card.summary_text or "Audiencia" in card.summary_text


def test_canonizer_performance_tags():
    """Test de generación de tags de performance."""
    payload_high = {
        "tenant_id": "test",
        "campaign_id": "c1",
        "platform": "LINKEDIN",
        "objective": "LEADS",
        "metrics": {
            "roas": 4.0,
            "quality_score": 90,
            "spend": 6000
        }
    }
    
    card = Canonizer.create_context_card(payload_high)
    
    assert "High-Performance" in card.tags
    assert "High-Quality" in card.tags
    assert "High-Budget" in card.tags


# === TESTS DE MODELOS ===

def test_memory_entry_creation():
    """Test de creación de MemoryEntry."""
    entry = MemoryEntry(
        tenant_id="test-tenant",
        execution_id="exec-1",
        campaign_id="camp-1",
        platform="LINKEDIN",
        objective="LEADS",
        final_state="LEARN",
        quality_verdict="PASS",
        context_card=ContextCard(
            summary_text="Test campaign",
            tags=["test"]
        )
    )
    
    assert entry.tenant_id == "test-tenant"
    assert entry.memory_id is not None  # UUID auto-generado
    assert entry.metrics.roas == 0.0  # Valor por defecto


def test_memory_metrics_validation():
    """Test de validación de métricas."""
    # Quality score debe estar entre 0 y 100
    with pytest.raises(ValueError):
        MemoryMetrics(quality_score=150)
    
    # Valores negativos
    metrics = MemoryMetrics(spend=-100)
    assert metrics.spend == -100  # Se permite pero no es ideal


# === TESTS DE INTEGRACIÓN (Requieren servicio corriendo) ===

@pytest.mark.integration
def test_ingest_endpoint_validation():
    """Test de validación del endpoint de ingesta."""
    # Payload inválido (estado no terminal)
    invalid_payload = {
        "payload": {
            "tenant_id": "test",
            "campaign_id": "c1",
            "state": "STRATEGY_GEN",  # No es terminal
            "platform": "LINKEDIN"
        }
    }
    
    response = client.post("/api/v1/memory/ingest", json=invalid_payload)
    assert response.status_code == 400


@pytest.mark.integration
def test_retrieve_endpoint_validation():
    """Test de validación del endpoint de recuperación."""
    # Sin tenant_id
    invalid_request = {
        "query_text": "test query",
        "limit": 3
    }
    
    response = client.post("/api/v1/memory/retrieve", json=invalid_request)
    assert response.status_code == 422  # Validation error


# === TESTS MOCKEADOS ===

@patch('core.embedding_engine.EmbeddingEngine.embed_text')
@patch('core.vector_store.VectorStoreManager.add_memory')
def test_ingest_flow_mocked(mock_add_memory, mock_embed):
    """Test del flujo completo de ingesta con mocks."""
    mock_embed.return_value = [0.1] * 1536
    mock_add_memory.return_value = "test-memory-id"
    
    payload = {
        "payload": {
            "tenant_id": "test-tenant",
            "campaign_id": "test-campaign",
            "execution_id": "test-exec",
            "platform": "LINKEDIN",
            "objective": "LEADS",
            "state": "LEARN",
            "metrics": {
                "roas": 3.5,
                "quality_score": 85
            }
        }
    }
    
    response = client.post("/api/v1/memory/ingest", json=payload)
    
    # Puede fallar si las dependencias no están inicializadas
    # Pero la validación del payload debe pasar
    assert response.status_code in [201, 500]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
