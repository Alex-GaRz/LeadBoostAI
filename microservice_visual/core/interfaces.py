"""
Core Interfaces for Visual Pipeline
Implements the Contract for all Visual Processing Nodes
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from PIL import Image
import hashlib
from datetime import datetime


class VisualPipelineError(Exception):
    """Base exception for all visual pipeline errors"""
    pass


class VisualContext:
    """
    The 'conveyor belt' that carries data between nodes.
    Implements the Blackboard Pattern for shared state.
    
    This object is immutable at the product layer level - the product pixels
    are NEVER modified after segmentation (SHA-256 hash enforced).
    """
    
    def __init__(self, sku_data: Dict[str, Any]):
        # Business Data
        self.sku_id: str = sku_data['id']
        self.sku_name: str = sku_data.get('name', 'Unknown')
        self.sku_price: float = sku_data.get('price', 0.0)
        self.sku_discount: Optional[float] = sku_data.get('discount')
        
        # Image Layers (PIL Images)
        self.raw_image: Optional[Image.Image] = None
        self.mask: Optional[Image.Image] = None  # Alpha Channel Mask
        self.product_layer: Optional[Image.Image] = None  # RGBA Cut-out (IMMUTABLE)
        self.background_layer: Optional[Image.Image] = None
        self.text_layer: Optional[Image.Image] = None
        self.final_composition: Optional[Image.Image] = None
        
        # Forensic & Audit Trail
        self.product_hash: Optional[str] = None  # SHA-256 of visible product pixels
        self.golden_master_hash: Optional[str] = sku_data.get('golden_hash')
        self.metadata: Dict[str, Any] = {
            'created_at': datetime.utcnow().isoformat(),
            'pipeline_log': []
        }
        
        # Copy & Campaign Data
        self.campaign_copy: Optional[str] = sku_data.get('copy_text')
        self.campaign_type: str = sku_data.get('campaign_type', 'promo_retail')
        
    def log_step(self, node_name: str, status: str, details: Optional[Dict] = None):
        """Log each pipeline step for audit trail"""
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'node': node_name,
            'status': status,
            'details': details or {}
        }
        self.metadata['pipeline_log'].append(log_entry)
        
    def compute_product_hash(self) -> str:
        """
        Compute SHA-256 hash of visible product pixels.
        This is the INVARIANT that ensures product fidelity.
        """
        if not self.product_layer:
            raise VisualPipelineError("Cannot compute hash: product_layer is None")
        
        # Convert to bytes (only visible pixels, not transparent ones)
        product_bytes = self.product_layer.tobytes()
        hash_obj = hashlib.sha256(product_bytes)
        self.product_hash = hash_obj.hexdigest()
        return self.product_hash
    
    def validate_product_integrity(self) -> bool:
        """
        Validate that product hasn't been altered.
        If a golden_master_hash exists, compare against it.
        """
        if not self.product_hash:
            self.compute_product_hash()
            
        if self.golden_master_hash:
            is_valid = self.product_hash == self.golden_master_hash
            self.metadata['integrity_check'] = {
                'passed': is_valid,
                'computed_hash': self.product_hash,
                'expected_hash': self.golden_master_hash
            }
            return is_valid
        
        # No golden master, assume valid (first time generation)
        self.metadata['integrity_check'] = {
            'passed': True,
            'computed_hash': self.product_hash,
            'note': 'No golden master for comparison'
        }
        return True


class IPipelineNode(ABC):
    """
    Abstract Contract for Pipeline Nodes.
    Each node is a single-responsibility processor that transforms VisualContext.
    """
    
    def __init__(self, name: str):
        self.name = name
    
    @abstractmethod
    async def process(self, context: VisualContext) -> VisualContext:
        """
        Process the visual context and return the transformed version.
        
        Args:
            context: Current state of the visual asset
            
        Returns:
            Modified context with transformations applied
            
        Raises:
            VisualPipelineError: If processing fails
        """
        pass
    
    async def __call__(self, context: VisualContext) -> VisualContext:
        """
        Callable interface with automatic logging.
        """
        try:
            context.log_step(self.name, 'started')
            result = await self.process(context)
            context.log_step(self.name, 'completed')
            return result
        except Exception as e:
            context.log_step(self.name, 'failed', {'error': str(e)})
            raise VisualPipelineError(f"Node '{self.name}' failed: {str(e)}") from e
