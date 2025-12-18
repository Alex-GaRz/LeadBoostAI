"""
Generic HTTP service client for inter-service communication.
CRITICAL: This client uses HTTP calls only - NO direct imports from other microservices.
"""

import httpx
import logging
from typing import Dict, Any, Optional, List
from uuid import UUID

from contracts import CampaignPayload, StrategyBrief, QualityReport

logger = logging.getLogger(__name__)


class ServiceClientError(Exception):
    """Exception raised when a service call fails."""
    pass


class ServiceClient:
    """
    Generic HTTP client for calling other microservices.
    
    RULE OF GOLD: This class MUST NOT import code from microservice_visual, 
    backend, or any other service. All communication is via HTTP/REST.
    """
    
    def __init__(
        self,
        radar_url: str,
        analyst_url: str,
        visual_url: str,
        optimizer_url: str,
        memory_url: str = "http://localhost:8006",
        timeout: float = 30.0,
        max_retries: int = 2,
        backoff_base: float = 0.5,
    ):
        """
        Initialize the service client with URLs for each microservice.
        
        Args:
            radar_url: URL of the Radar service
            analyst_url: URL of the Analyst service
            visual_url: URL of the Visual engine
            optimizer_url: URL of the Optimizer service
            memory_url: URL of the Memory service (default: http://localhost:8006)
            timeout: Request timeout in seconds
            max_retries: Maximum retry attempts for network errors (default: 2)
            backoff_base: Base delay for exponential backoff in seconds (default: 0.5)
        """
        self.radar_url = radar_url.rstrip('/')
        self.analyst_url = analyst_url.rstrip('/')
        self.visual_url = visual_url.rstrip('/')
        self.optimizer_url = optimizer_url.rstrip('/')
        self.memory_url = memory_url.rstrip('/')
        self.timeout = timeout
        self.max_retries = max_retries
        self.backoff_base = backoff_base
        
        # Create async HTTP client
        self.client = httpx.AsyncClient(timeout=timeout)
        
        logger.info(
            f"ServiceClient initialized with timeout={timeout}s, "
            f"max_retries={max_retries}, backoff_base={backoff_base}s"
        )
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
    
    async def _post(self, url: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generic POST request handler with retry logic.
        
        SECURITY PATCH: Implements exponential backoff for network errors only.
        Fails fast on 4xx (client errors) and 5xx (server errors).
        
        Args:
            url: Full URL to post to
            data: JSON data to send
            
        Returns:
            Response JSON data
            
        Raises:
            ServiceClientError: If the request fails
        """
        import asyncio
        
        last_exception = None
        
        for attempt in range(self.max_retries + 1):
            try:
                logger.debug(f"POST {url} (attempt {attempt + 1}/{self.max_retries + 1})")
                response = await self.client.post(url, json=data)
                response.raise_for_status()
                return response.json()
                
            except httpx.HTTPStatusError as e:
                # FAIL-FAST: Do NOT retry 4xx (client errors) or 5xx (server errors)
                # These are business logic errors that won't be fixed by retrying
                logger.error(
                    f"HTTP error calling {url}: {e.response.status_code} - {e.response.text}"
                )
                raise ServiceClientError(
                    f"Service call failed: {e.response.status_code}"
                ) from e
                
            except (httpx.RequestError, httpx.ConnectTimeout, httpx.ReadTimeout) as e:
                # RETRY: Network errors - service might be temporarily unavailable
                last_exception = e
                logger.warning(
                    f"Network error calling {url} (attempt {attempt + 1}/{self.max_retries + 1}): {str(e)}"
                )
                
                # If this was the last attempt, raise
                if attempt >= self.max_retries:
                    logger.error(f"Max retries ({self.max_retries}) exceeded for {url}")
                    raise ServiceClientError(f"Service unreachable after {self.max_retries} retries: {str(e)}") from e
                
                # Exponential backoff: 0.5s, 1s, 2s, 4s...
                delay = self.backoff_base * (2 ** attempt)
                logger.info(f"Retrying in {delay}s...")
                await asyncio.sleep(delay)
                
            except Exception as e:
                # Unexpected errors - fail fast
                logger.error(f"Unexpected error calling {url}: {str(e)}")
                raise ServiceClientError(f"Unexpected error: {str(e)}") from e
        
        # Should never reach here, but just in case
        if last_exception:
            raise ServiceClientError(f"Service unreachable: {str(last_exception)}") from last_exception
        raise ServiceClientError("Unknown error during service call")
    
    # ============================================================
    # SERVICE-SPECIFIC METHODS
    # ============================================================
    
    async def call_radar_scan(self, payload: CampaignPayload) -> Dict[str, Any]:
        """
        Call the Radar service to perform market scanning.
        
        Args:
            payload: Current campaign payload
            
        Returns:
            Radar scan results
        """
        url = f"{self.radar_url}/api/v1/scan"
        data = {
            "campaign_id": str(payload.campaign_id),
            "tenant_id": str(payload.tenant_id),
            "execution_id": str(payload.execution_id),
        }
        
        logger.info(f"Calling Radar service for campaign {payload.campaign_id}")
        result = await self._post(url, data)
        logger.info(f"Radar scan completed for campaign {payload.campaign_id}")
        
        return result
    
    async def call_strategy_generation(self, payload: CampaignPayload) -> StrategyBrief:
        """
        Call the Analyst service to generate a strategy brief.
        
        Args:
            payload: Current campaign payload (with radar data)
            
        Returns:
            Generated StrategyBrief
        """
        url = f"{self.analyst_url}/api/v1/generate-strategy"
        data = {
            "campaign_id": str(payload.campaign_id),
            "tenant_id": str(payload.tenant_id),
            "execution_id": str(payload.execution_id),
            # Include radar data from execution log if available
            "context": {
                "execution_log": [entry.model_dump() for entry in payload.execution_log[-5:]]
            }
        }
        
        logger.info(f"Calling Analyst service for campaign {payload.campaign_id}")
        result = await self._post(url, data)
        
        # Parse response into StrategyBrief
        strategy = StrategyBrief(**result)
        logger.info(f"Strategy generated for campaign {payload.campaign_id}")
        
        return strategy
    
    async def call_content_production(self, payload: CampaignPayload) -> List[Dict[str, Any]]:
        """
        Call the Visual engine to produce content assets.
        
        Args:
            payload: Current campaign payload (with strategy)
            
        Returns:
            List of generated visual assets
        """
        url = f"{self.visual_url}/api/v1/generate"
        
        if not payload.strategy:
            raise ServiceClientError("Cannot produce content without a strategy")
        
        data = {
            "campaign_id": str(payload.campaign_id),
            "tenant_id": str(payload.tenant_id),
            "execution_id": str(payload.execution_id),
            "strategy": payload.strategy.model_dump(),
        }
        
        logger.info(f"Calling Visual service for campaign {payload.campaign_id}")
        result = await self._post(url, data)
        
        # Expecting a list of assets
        assets = result.get("assets", [])
        logger.info(f"Content produced for campaign {payload.campaign_id}: {len(assets)} assets")
        
        return assets
    
    async def call_quality_audit(self, payload: CampaignPayload) -> QualityReport:
        """
        Call the Optimizer service to perform quality audit.
        
        Args:
            payload: Current campaign payload (with assets)
            
        Returns:
            QualityReport with audit results
        """
        url = f"{self.optimizer_url}/api/v1/audit-quality"
        
        if not payload.assets:
            raise ServiceClientError("Cannot audit quality without assets")
        
        # INTEGRATION FIX: Send the ENTIRE CampaignPayload to the governance engine
        # This ensures all context (execution_log, strategy, assets) is available
        # for comprehensive rule evaluation
        logger.info(f"Calling Optimizer service for quality audit: {payload.campaign_id}")
        response = await self.client.post(url, json=payload.model_dump(mode='json'))
        response.raise_for_status()
        result = response.json()
        
        # Parse response into QualityReport
        report = QualityReport(**result)
        logger.info(
            f"Quality audit completed for campaign {payload.campaign_id}: {report.verdict.value}"
        )
        
        return report
    
    async def call_publish_campaign(self, payload: CampaignPayload) -> Dict[str, Any]:
        """
        Call the Optimizer service to publish the campaign.
        
        Args:
            payload: Current campaign payload (quality approved)
            
        Returns:
            Publication results
        """
        url = f"{self.optimizer_url}/api/v1/publish"
        
        data = {
            "campaign_id": str(payload.campaign_id),
            "tenant_id": str(payload.tenant_id),
            "execution_id": str(payload.execution_id),
            "assets": payload.assets,
            "strategy": payload.strategy.model_dump() if payload.strategy else None,
        }
        
        logger.info(f"Calling Optimizer service to publish campaign {payload.campaign_id}")
        result = await self._post(url, data)
        logger.info(f"Campaign {payload.campaign_id} published successfully")
        
        return result
    
    async def call_memory_retrieve(self, tenant_id: UUID, query: str, limit: int = 3) -> List[Dict]:
        """
        Call the Memory service to retrieve similar past campaigns.
        
        Args:
            tenant_id: Tenant ID for isolation
            query: Natural language query
            limit: Maximum number of results
            
        Returns:
            List of memory entries (empty list if fails)
        """
        try:
            url = f"{self.memory_url}/api/v1/memory/retrieve"
            data = {
                "tenant_id": str(tenant_id),
                "query_text": query,
                "limit": limit
            }
            
            logger.info(f"Retrieving memories for tenant {tenant_id}: {query[:50]}...")
            result = await self._post(url, data)
            memories = result.get("results", [])
            logger.info(f"Retrieved {len(memories)} memories for tenant {tenant_id}")
            return memories
            
        except Exception as e:
            logger.error(f"Memory retrieval failed: {str(e)}", exc_info=True)
            return []  # Don't break the flow
    
    async def call_memory_ingest(self, payload: CampaignPayload) -> Optional[str]:
        """
        Call the Memory service to ingest a completed campaign.
        
        Args:
            payload: Completed campaign payload
            
        Returns:
            Memory ID if successful, None if fails
        """
        try:
            url = f"{self.memory_url}/api/v1/memory/ingest"
            data = {
                "payload": payload.model_dump(mode='json')
            }
            
            logger.info(f"Ingesting campaign {payload.campaign_id} into memory")
            result = await self._post(url, data)
            memory_id = result.get("memory_id")
            logger.info(f"Campaign {payload.campaign_id} ingested: memory_id={memory_id}")
            return memory_id
            
        except Exception as e:
            logger.error(f"Memory ingestion failed: {str(e)}", exc_info=True)
            return None  # Don't break the flow
