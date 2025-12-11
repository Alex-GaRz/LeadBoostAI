"""
API Routes for Visual Engine
Exposes HTTP endpoints for visual asset generation
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from typing import Optional
import logging
from pathlib import Path
import uuid
from datetime import datetime

from core import VisualPipeline, VisualContext
from nodes import (
    InputNode,
    SegmentationNode,
    BackgroundNode,
    CompositionNode,
    TypographyNode,
    ForensicNode
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _safe_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal attacks.
    Only returns the filename component without any directory traversal.
    """
    return Path(filename).name


class GenerateAssetRequest(BaseModel):
    """Request model for asset generation"""
    sku_id: str
    sku_name: str
    price: float
    discount: Optional[float] = None
    campaign_copy: Optional[str] = None
    campaign_type: str = "promo_retail"
    background_strategy: str = "gradient"
    product_position: str = "center"
    golden_hash: Optional[str] = None


class GenerateAssetResponse(BaseModel):
    """Response model for asset generation"""
    success: bool
    asset_url: str
    sku_id: str
    metadata: dict


@router.post("/generate_asset", response_model=GenerateAssetResponse)
async def generate_asset(request: GenerateAssetRequest):
    """
    Generate visual asset for a product.
    
    This is the main entry point that orchestrates the entire pipeline:
    1. Load product image
    2. Segment product from background
    3. Generate new background
    4. Render typography
    5. Compose layers
    6. Validate with OCR
    7. Save final asset
    
    Returns URL to generated asset.
    """
    try:
        logger.info(f"Generating asset for SKU: {request.sku_id}")
        
        # Build SKU data dictionary
        sku_data = {
            'id': request.sku_id,
            'name': request.sku_name,
            'price': request.price,
            'discount': request.discount,
            'copy_text': request.campaign_copy,
            'campaign_type': request.campaign_type,
            'golden_hash': request.golden_hash
        }
        
        # Initialize context
        context = VisualContext(sku_data)
        
        # Build pipeline
        pipeline = VisualPipeline(name="ProductAssetGenerator")
        pipeline.add_node(InputNode(assets_dir="assets"))
        pipeline.add_node(SegmentationNode(alpha_matting=True))
        pipeline.add_node(BackgroundNode(strategy=request.background_strategy))
        pipeline.add_node(TypographyNode(templates_dir="templates"))
        pipeline.add_node(CompositionNode(product_position=request.product_position))
        pipeline.add_node(ForensicNode(strict_mode=True))  # Enable validation
        
        # Execute pipeline
        result_context = await pipeline.execute(context)
        
        # Save final composition
        output_dir = Path("output")
        output_dir.mkdir(exist_ok=True)
        
        # Generate unique filename with sanitization
        safe_sku_id = _safe_filename(request.sku_id)
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{safe_sku_id}_{timestamp}.png"
        output_path = output_dir / filename
        
        # CPU-bound I/O operation: Run in thread pool
        def _save_image():
            result_context.final_composition.save(output_path, format='PNG')
        
        await run_in_threadpool(_save_image)
        
        logger.info(f"Asset saved: {output_path}")
        
        return GenerateAssetResponse(
            success=True,
            asset_url=f"/assets/{filename}",
            sku_id=request.sku_id,
            metadata=result_context.metadata
        )
        
    except Exception as e:
        logger.error(f"Asset generation failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Asset generation failed: {str(e)}"
        )


@router.get("/assets/{filename}")
async def get_asset(filename: str):
    """
    Retrieve generated asset by filename.
    """
    # Sanitize filename to prevent path traversal
    safe_filename = _safe_filename(filename)
    output_dir = Path("output")
    file_path = output_dir / safe_filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Asset not found")
    
    return FileResponse(file_path, media_type="image/png")


@router.post("/upload_product_image")
async def upload_product_image(
    sku_id: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Upload a product image to the assets directory.
    Required before generating assets for a new SKU.
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image"
            )
        
        # Sanitize SKU ID to prevent path traversal
        safe_sku_id = _safe_filename(sku_id)
        
        # Save to assets directory
        assets_dir = Path("assets")
        assets_dir.mkdir(exist_ok=True)
        
        # Determine file extension (also sanitize)
        original_filename = file.filename or "upload.png"
        ext = Path(_safe_filename(original_filename)).suffix or '.png'
        filename = f"{safe_sku_id}{ext}"
        file_path = assets_dir / filename
        
        # Read file content
        content = await file.read()
        
        # CPU-bound I/O operation: Write file in thread pool
        def _write_file():
            with open(file_path, 'wb') as f:
                f.write(content)
        
        await run_in_threadpool(_write_file)
        
        logger.info(f"Uploaded product image: {file_path}")
        
        return {
            'success': True,
            'sku_id': safe_sku_id,
            'filename': filename,
            'path': str(file_path)
        }
        
    except Exception as e:
        logger.error(f"Image upload failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {
        'status': 'healthy',
        'service': 'microservice_visual',
        'version': '1.0.0'
    }
