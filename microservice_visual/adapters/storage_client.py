"""
StorageClient: Adapter para persistencia de assets (S3/MinIO/LocalFS).
Responsabilidad: Guardar archivos y retornar URLs accesibles.
"""
from abc import ABC, abstractmethod
import os
from pathlib import Path
from uuid import uuid4


class StorageClient(ABC):
    """
    Interfaz abstracta para clientes de almacenamiento.
    """

    @abstractmethod
    async def upload_asset(self, file_bytes: bytes, filename: str) -> str:
        """
        Sube el archivo y retorna la URL pública/firmada.
        
        Args:
            file_bytes: Bytes del archivo a subir
            filename: Nombre del archivo (incluye extensión)
            
        Returns:
            str: URL pública o path accesible del archivo
        """
        pass


class LocalStorageClient(StorageClient):
    """
    Cliente de almacenamiento local para desarrollo.
    Guarda archivos en carpeta `generated_assets/`.
    """

    def __init__(self, base_dir: str = "generated_assets"):
        """
        Args:
            base_dir: Directorio base donde se guardarán los assets
        """
        self.base_dir = base_dir
        Path(self.base_dir).mkdir(parents=True, exist_ok=True)

    async def upload_asset(self, file_bytes: bytes, filename: str) -> str:
        """
        Guarda el archivo localmente y retorna path simulado.
        
        Args:
            file_bytes: Bytes del archivo
            filename: Nombre del archivo
            
        Returns:
            str: Path simulado tipo "/static/generated/<uuid>.png"
        """
        # Generar nombre único si no viene con UUID
        if not any(c in filename for c in ['-', '_'] * 4):  # Simple check for UUID pattern
            name_parts = filename.rsplit('.', 1)
            ext = name_parts[1] if len(name_parts) > 1 else 'png'
            unique_filename = f"{uuid4()}.{ext}"
        else:
            unique_filename = filename
        
        # Guardar archivo
        file_path = os.path.join(self.base_dir, unique_filename)
        with open(file_path, 'wb') as f:
            f.write(file_bytes)
        
        # Retornar URL simulada
        return f"/static/generated/{unique_filename}"

    def get_full_path(self, filename: str) -> str:
        """
        Obtiene el path completo de un archivo.
        
        Args:
            filename: Nombre del archivo
            
        Returns:
            str: Path absoluto del archivo
        """
        return os.path.abspath(os.path.join(self.base_dir, filename))
