"""
CLIENT-QUALITY VISUAL DEMO
==========================
Genera una imagen publicitaria limpia, usable y presentable
usando reglas de diseño (no IA pesada todavía).

Objetivo: imagen demo para cliente.
"""

import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# ---- PATH FIX ----
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

OUTPUT_DIR = ROOT / "demo_output"
OUTPUT_DIR.mkdir(exist_ok=True)

OUTPUT_PATH = OUTPUT_DIR / "client_ready_visual.png"


def generate_client_ready_visual(path: Path):
    W, H = 1080, 1080

    # Fondo premium
    img = Image.new("RGB", (W, H), color=(245, 247, 250))
    draw = ImageDraw.Draw(img)

    # Header brand bar
    draw.rectangle([(0, 0), (W, 120)], fill=(18, 22, 35))

    # Brand name
    draw.text((60, 40), "LeadBoostAI", fill=(255, 255, 255))

    # Hero card
    draw.rectangle(
        [(120, 180), (960, 860)],
        fill=(255, 255, 255),
        outline=(220, 220, 220),
        width=4
    )

    # Headline
    headline = "Convierte más clientes\ncon IA en minutos"
    draw.text((220, 260), headline, fill=(20, 20, 20))

    # Subheadline
    sub = "Automatiza anuncios, copy y creatividad\nsin diseñadores ni agencias"
    draw.text((220, 380), sub, fill=(90, 90, 90))

    # CTA Button
    draw.rectangle(
        [(220, 560), (520, 640)],
        fill=(80, 120, 255)
    )
    draw.text((260, 585), "Empieza ahora", fill=(255, 255, 255))

    # Footer
    draw.text((380, 900), "Generado automáticamente por LeadBoostAI",
              fill=(120, 120, 120))

    img.save(path)
    return path


if __name__ == "__main__":
    p = generate_client_ready_visual(OUTPUT_PATH)
    print(f"✅ IMAGEN CLIENTE GENERADA EN: {p}")
