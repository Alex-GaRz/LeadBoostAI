# Microservice Visual - Deterministic Visual Engine

## Overview
This microservice implements **RFC-PHOENIX-04: Deterministic Visual Engine (DVE)** for generating pixel-perfect product marketing assets with zero AI hallucination.

## Architecture

### Core Principles
1. **Product Immutability**: Product pixels are NEVER modified after segmentation
2. **Deterministic Composition**: Assets are assembled (not generated) from layers
3. **Forensic Validation**: OCR verifies business data accuracy before save
4. **Pipeline Architecture**: DAG-based processing with single-responsibility nodes

### Pipeline Stages

```
Input → Segmentation → Background → Typography → Composition → Forensic → Output
```

#### 1. Input Node
- Loads raw product images
- Validates minimum quality requirements
- Converts to RGBA format

#### 2. Segmentation Node
- Uses `rembg` (u2net model) for product isolation
- Alpha matting for perfect edges
- Computes SHA-256 hash for integrity tracking

#### 3. Background Node
- Generates atmosphere (solid, gradient, stock, GenAI)
- Product mask defines "keep-out" zones
- Currently supports solid/gradient (GenAI in roadmap)

#### 4. Typography Node
- Renders HTML/CSS templates using Playwright
- Pixel-perfect brand fidelity (web fonts, kerning)
- Transparent layer for compositing

#### 5. Composition Node
- Alpha-composite layers (Background → Product → Text)
- Product positioned but NEVER filtered/distorted
- Hash validation post-composition

#### 6. Forensic Node
- OCR validation using Tesseract/EasyOCR
- Price matching: OCR result == Database
- Strict mode: Reject on validation failure

## Installation

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Ensure Tesseract is installed (system-level)
# Ubuntu/Debian: sudo apt-get install tesseract-ocr
# macOS: brew install tesseract
# Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki

# Run server
python main.py
```

### Docker

```bash
# Build image
docker build -t microservice_visual:latest .

# Run container
docker run -p 8000:8000 \
  -v $(pwd)/assets:/app/assets \
  -v $(pwd)/output:/app/output \
  microservice_visual:latest
```

## API Usage

### Generate Asset

```bash
POST /api/v1/generate_asset
Content-Type: application/json

{
  "sku_id": "SHOE-001",
  "sku_name": "Nike Air Max 90",
  "price": 129.99,
  "discount": 25,
  "campaign_copy": "¡OFERTA EXCLUSIVA! Corre con estilo",
  "campaign_type": "promo_retail",
  "background_strategy": "gradient",
  "product_position": "center"
}
```

**Response:**
```json
{
  "success": true,
  "asset_url": "/assets/SHOE-001_20241208_143022.png",
  "sku_id": "SHOE-001",
  "metadata": {
    "created_at": "2024-12-08T14:30:22",
    "segmentation": {
      "product_hash": "a1b2c3d4...",
      "coverage_percent": 42.5
    },
    "forensic_report": {
      "status": "PASS",
      "price_validation": true
    }
  }
}
```

### Upload Product Image

```bash
POST /api/v1/upload_product_image
Content-Type: multipart/form-data

sku_id: SHOE-001
file: [binary image data]
```

### Health Check

```bash
GET /api/v1/health
```

## Directory Structure

```
microservice_visual/
├── core/                   # Pipeline orchestration
│   ├── interfaces.py       # Abstract contracts
│   ├── pipeline.py         # DAG executor
│   └── __init__.py
├── nodes/                  # Processing implementations
│   ├── input_node.py
│   ├── segmentation_node.py
│   ├── background_node.py
│   ├── typography_node.py
│   ├── composition_node.py
│   └── forensic_node.py
├── templates/              # HTML/CSS templates
│   ├── promo_retail.html
│   └── luxury_showcase.html
├── api/                    # FastAPI routes
│   └── routes.py
├── assets/                 # Input product images
├── output/                 # Generated assets
├── main.py                 # Application entry point
├── requirements.txt
├── Dockerfile
└── README.md
```

## Configuration

### Environment Variables

- `TESSDATA_PREFIX`: Tesseract data directory (auto-set in Docker)
- `PLAYWRIGHT_BROWSERS_PATH`: Browser installation path (optional)

### Templates

Add new campaign templates to `templates/`:
- Use Jinja2 syntax: `{{ price }}`, `{{ copy_text }}`, etc.
- Set `background: transparent` in CSS
- Use web fonts for brand fidelity

## Testing

```bash
# Unit tests (TODO)
pytest tests/

# Manual test with sample data
curl -X POST http://localhost:8000/api/v1/generate_asset \
  -H "Content-Type: application/json" \
  -d @test_payload.json
```

## Roadmap

- [ ] GenAI background generation (Stable Diffusion)
- [ ] Stock image integration (Unsplash/Pexels)
- [ ] Golden master hash database
- [ ] Multi-language OCR support
- [ ] Batch processing endpoint
- [ ] Real-time preview websocket

## Known Limitations

1. **Playwright Browser**: First render may be slow (browser startup)
2. **OCR Accuracy**: Works best with high-contrast text
3. **Background GenAI**: Not yet implemented (roadmap item)

## License

Proprietary - LeadBoostAI Enterprise
