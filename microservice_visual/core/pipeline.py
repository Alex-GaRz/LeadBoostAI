"""
Visual Pipeline Orchestrator
Implements DAG (Directed Acyclic Graph) execution for visual processing
"""

from typing import List
from .interfaces import IPipelineNode, VisualContext, VisualPipelineError
import logging

logger = logging.getLogger(__name__)


class VisualPipeline:
    """
    Orchestrator that chains IPipelineNode instances in sequence.
    This is the 'assembly line' that transforms raw SKU data into final visual assets.
    """
    
    def __init__(self, name: str = "DefaultVisualPipeline"):
        self.name = name
        self.nodes: List[IPipelineNode] = []
        
    def add_node(self, node: IPipelineNode) -> 'VisualPipeline':
        """
        Add a processing node to the pipeline.
        Returns self for method chaining.
        
        Example:
            pipeline = VisualPipeline()
                .add_node(InputNode())
                .add_node(SegmentationNode())
                .add_node(CompositionNode())
        """
        if not isinstance(node, IPipelineNode):
            raise TypeError(f"Node must implement IPipelineNode interface, got {type(node)}")
        
        self.nodes.append(node)
        logger.info(f"Added node '{node.name}' to pipeline '{self.name}'")
        return self
    
    async def execute(self, context: VisualContext) -> VisualContext:
        """
        Execute the entire pipeline sequentially.
        Each node receives the output of the previous node.
        
        Args:
            context: Initial context with SKU data
            
        Returns:
            Final context with all transformations applied
            
        Raises:
            VisualPipelineError: If any node fails
        """
        logger.info(f"Starting pipeline '{self.name}' for SKU {context.sku_id}")
        
        if not self.nodes:
            raise VisualPipelineError("Cannot execute empty pipeline")
        
        current_context = context
        
        for node in self.nodes:
            try:
                logger.debug(f"Executing node: {node.name}")
                current_context = await node(current_context)
            except VisualPipelineError:
                # Already logged by the node's __call__ method
                raise
            except Exception as e:
                error_msg = f"Unexpected error in node '{node.name}': {str(e)}"
                logger.error(error_msg)
                raise VisualPipelineError(error_msg) from e
        
        logger.info(f"Pipeline '{self.name}' completed successfully for SKU {context.sku_id}")
        return current_context
    
    def get_node_names(self) -> List[str]:
        """Get list of all node names in the pipeline"""
        return [node.name for node in self.nodes]
    
    def clear(self):
        """Remove all nodes from the pipeline"""
        self.nodes.clear()
        logger.info(f"Cleared all nodes from pipeline '{self.name}'")
