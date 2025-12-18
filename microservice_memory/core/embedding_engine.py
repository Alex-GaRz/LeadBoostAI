"""
Embedding Engine - FASE 6.1
Motor de generación de embeddings con fallback a modelos locales.
"""

from typing import List, Optional
import logging
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from .config import get_settings

logger = logging.getLogger(__name__)


class EmbeddingEngine:
    """
    Motor de embeddings con soporte para OpenAI y modelos locales.
    Fallback automático si OpenAI no está disponible.
    """
    
    def __init__(self):
        """Inicializa el motor de embeddings."""
        self.settings = get_settings()
        self.openai_available = False
        self.local_model = None
        
        # Intentar configurar OpenAI
        if self.settings.OPENAI_API_KEY:
            try:
                import openai
                self.openai_client = openai.OpenAI(api_key=self.settings.OPENAI_API_KEY)
                self.openai_available = True
                logger.info(f"OpenAI embeddings initialized: {self.settings.EMBEDDING_MODEL}")
            except Exception as e:
                logger.warning(f"OpenAI initialization failed: {e}")
                self.openai_available = False
        else:
            logger.warning("No OPENAI_API_KEY provided, will use local embeddings")
        
        # Fallback a modelo local si necesario
        if not self.openai_available or self.settings.USE_LOCAL_EMBEDDINGS:
            try:
                from sentence_transformers import SentenceTransformer
                self.local_model = SentenceTransformer(self.settings.LOCAL_EMBEDDING_MODEL)
                logger.info(f"Local embeddings initialized: {self.settings.LOCAL_EMBEDDING_MODEL}")
            except ImportError:
                logger.warning(
                    "sentence-transformers not available. "
                    "Will use dummy embeddings (ONLY FOR DEVELOPMENT)"
                )
            except Exception as e:
                logger.error(f"Failed to load local model: {e}")
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),  # PATCH FASE 6.1: Aumentar min wait para mejor resiliencia
        retry=retry_if_exception_type(Exception)
    )
    def embed_text(self, text: str) -> List[float]:
        """
        Genera embedding para un texto.
        
        Args:
            text: Texto a vectorizar
            
        Returns:
            Vector de embeddings (dimensión según configuración)
            
        Raises:
            RuntimeError: Si todos los métodos de embedding fallan
        """
        if not text or len(text.strip()) == 0:
            logger.warning("Empty text provided for embedding, using zero vector")
            return self._get_zero_vector()
        
        # Método 1: OpenAI (preferido)
        if self.openai_available:
            try:
                return self._embed_with_openai(text)
            except Exception as e:
                logger.error(f"OpenAI embedding failed: {e}")
                # Continuar al fallback
        
        # Método 2: Modelo Local (fallback)
        if self.local_model is not None:
            try:
                return self._embed_with_local(text)
            except Exception as e:
                logger.error(f"Local embedding failed: {e}")
        
        # Método 3: Vector dummy (solo desarrollo)
        logger.error("All embedding methods failed, using dummy vector")
        return self._get_zero_vector()
    
    def _embed_with_openai(self, text: str) -> List[float]:
        """Genera embedding usando OpenAI API."""
        try:
            response = self.openai_client.embeddings.create(
                input=text,
                model=self.settings.EMBEDDING_MODEL
            )
            embedding = response.data[0].embedding
            
            logger.debug(f"OpenAI embedding generated: {len(embedding)} dimensions")
            return embedding
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise
    
    def _embed_with_local(self, text: str) -> List[float]:
        """Genera embedding usando modelo local (sentence-transformers)."""
        try:
            embedding = self.local_model.encode(text, convert_to_numpy=True)
            embedding_list = embedding.tolist()
            
            # Si el modelo local tiene dimensión diferente, ajustar
            if len(embedding_list) < self.settings.EMBEDDING_DIMENSION:
                # Padding con ceros
                embedding_list.extend([0.0] * (self.settings.EMBEDDING_DIMENSION - len(embedding_list)))
            elif len(embedding_list) > self.settings.EMBEDDING_DIMENSION:
                # Truncar
                embedding_list = embedding_list[:self.settings.EMBEDDING_DIMENSION]
            
            logger.debug(f"Local embedding generated: {len(embedding_list)} dimensions")
            return embedding_list
            
        except Exception as e:
            logger.error(f"Local model error: {e}")
            raise
    
    def _get_zero_vector(self) -> List[float]:
        """
        Retorna un vector de ceros.
        SOLO PARA DESARROLLO - No usar en producción.
        """
        logger.warning(
            "Using zero vector as fallback. "
            "This will NOT work for semantic search!"
        )
        return [0.0] * self.settings.EMBEDDING_DIMENSION
    
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Genera embeddings para múltiples textos.
        
        Args:
            texts: Lista de textos a vectorizar
            
        Returns:
            Lista de vectores de embeddings
        """
        try:
            # Si hay OpenAI disponible, usar batch API (más eficiente)
            if self.openai_available:
                try:
                    response = self.openai_client.embeddings.create(
                        input=texts,
                        model=self.settings.EMBEDDING_MODEL
                    )
                    embeddings = [item.embedding for item in response.data]
                    logger.info(f"Batch embedding completed: {len(embeddings)} texts")
                    return embeddings
                except Exception as e:
                    logger.error(f"Batch OpenAI embedding failed: {e}")
            
            # Fallback: Procesar uno por uno
            embeddings = []
            for text in texts:
                embeddings.append(self.embed_text(text))
            
            return embeddings
            
        except Exception as e:
            logger.error(f"Batch embedding failed: {e}")
            raise RuntimeError(f"Failed to generate batch embeddings: {e}")
    
    def get_engine_status(self) -> dict:
        """Retorna el estado del motor de embeddings."""
        return {
            "openai_available": self.openai_available,
            "local_model_loaded": self.local_model is not None,
            "embedding_model": self.settings.EMBEDDING_MODEL if self.openai_available else self.settings.LOCAL_EMBEDDING_MODEL,
            "embedding_dimension": self.settings.EMBEDDING_DIMENSION
        }
