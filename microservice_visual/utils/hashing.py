"""
Hashing utilities: Funciones para generar hashes de assets (evidencia forense).
Responsabilidad: Generar hashes SHA256 para reproducibilidad y auditoría.
"""
import hashlib


def sha256_bytes(data: bytes) -> str:
    """
    Genera hash SHA256 de bytes.
    
    Args:
        data: Bytes a hashear
        
    Returns:
        str: Hash SHA256 en formato hexadecimal
    """
    return hashlib.sha256(data).hexdigest()


def sha256_string(text: str) -> str:
    """
    Genera hash SHA256 de un string.
    
    Args:
        text: String a hashear
        
    Returns:
        str: Hash SHA256 en formato hexadecimal
    """
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def sha256_dict(data: dict) -> str:
    """
    Genera hash SHA256 de un diccionario (serializado de forma determinista).
    
    Args:
        data: Diccionario a hashear
        
    Returns:
        str: Hash SHA256 en formato hexadecimal
    """
    import json
    # Serializar de forma determinista (ordenar keys)
    serialized = json.dumps(data, sort_keys=True)
    return sha256_string(serialized)
