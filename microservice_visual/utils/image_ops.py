"""
ImageIO helpers: Operaciones de bajo nivel con PIL/OpenCV.
Responsabilidad: Helpers para carga, conversión y procesamiento básico de imágenes.
"""
from PIL import Image
import io
from typing import Tuple


def load_image(image_bytes: bytes) -> Image.Image:
    """
    Carga una imagen desde bytes.
    
    Args:
        image_bytes: Bytes de la imagen
        
    Returns:
        PIL.Image: Imagen cargada
        
    Raises:
        ValueError: Si los bytes no son una imagen válida
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        return img
    except Exception as e:
        raise ValueError(f"No se pudo cargar la imagen: {e}")


def save_to_bytes(image: Image.Image, format: str = 'PNG') -> bytes:
    """
    Convierte una imagen PIL a bytes.
    
    Args:
        image: Imagen PIL
        format: Formato de salida (PNG, JPEG, WEBP)
        
    Returns:
        bytes: Imagen en formato especificado
    """
    buffer = io.BytesIO()
    image.save(buffer, format=format.upper())
    buffer.seek(0)
    return buffer.read()


def resize_normalized(image: Image.Image, target_size: Tuple[int, int] = (1080, 1080)) -> Image.Image:
    """
    Redimensiona y normaliza una imagen.
    
    Args:
        image: Imagen PIL
        target_size: Tupla (width, height) de destino
        
    Returns:
        PIL.Image: Imagen redimensionada
    """
    return image.resize(target_size, Image.Resampling.LANCZOS)


def normalize_alpha(image: Image.Image) -> Image.Image:
    """
    Normaliza el canal alpha de una imagen.
    
    Args:
        image: Imagen PIL
        
    Returns:
        PIL.Image: Imagen con alpha normalizado o RGB si no tiene alpha
    """
    if image.mode in ('RGBA', 'LA'):
        return image
    elif image.mode == 'RGB':
        return image
    else:
        return image.convert('RGB')


def validate_image(image_bytes: bytes) -> bool:
    """
    Valida que los bytes representen una imagen válida.
    
    Args:
        image_bytes: Bytes a validar
        
    Returns:
        bool: True si es una imagen válida
    """
    try:
        img = load_image(image_bytes)
        # Validaciones básicas
        if img.size[0] == 0 or img.size[1] == 0:
            return False
        if img.size[0] < 64 or img.size[1] < 64:  # Mínimo razonable
            return False
        return True
    except Exception:
        return False
