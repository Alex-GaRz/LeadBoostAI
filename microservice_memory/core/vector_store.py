import os
import chromadb
from chromadb.config import Settings
import openai
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import logging
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

# Configuración de Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChromaDBAdapter:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ChromaDBAdapter, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        """Inicializa ChromaDB en modo persistente y Cliente OpenAI."""
        try:
            self.persist_path = "./chroma_db"
            os.makedirs(self.persist_path, exist_ok=True)
            
            self.chroma_client = chromadb.PersistentClient(path=self.persist_path)
            
            # Colección para estrategias de negocio
            self.collection = self.chroma_client.get_or_create_collection(
                name="strategic_memories",
                metadata={"hnsw:space": "cosine"} # Optimizado para similitud semántica
            )
            
            self.openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            logger.info("✅ ChromaDB Adapter & OpenAI Client Initialized.")
            
        except Exception as e:
            logger.critical(f"🔥 Critical Failure initializing Vector Store: {e}")
            raise e

    @retry(
        retry=retry_if_exception_type((openai.APIConnectionError, openai.RateLimitError, openai.APIError)),
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    def generate_embedding(self, text: str) -> List[float]:
        """Genera embedding de 1536 dimensiones con retries automáticos."""
        try:
            # text-embedding-3-small es más barato y eficiente para RAG
            response = self.openai_client.embeddings.create(
                input=text.replace("\n", " "),
                model="text-embedding-3-small"
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"❌ Error generating embedding: {e}")
            raise e

    def add_memory(self, memory_id: str, text: str, metadata: Dict[str, Any], trust_score: float):
        """Inserta o actualiza una memoria en el vector store."""
        try:
            vector = self.generate_embedding(text)
            
            # Aseguramos que el trust_score esté en metadata para filtrado rápido
            metadata['trust_score'] = float(trust_score)
            metadata['content_hash'] = str(hash(text)) # Simple hash para integridad
            
            self.collection.upsert(
                ids=[memory_id],
                embeddings=[vector],
                metadatas=[metadata],
                documents=[text]
            )
            logger.info(f"💾 Memory stored: {memory_id}")
            
        except Exception as e:
            logger.error(f"❌ Failed to store memory {memory_id}: {e}")
            # No lanzamos excepción para no detener el flujo principal, solo logueamos
            
    def get_memory_metadata(self, memory_id: str) -> Optional[Dict[str, Any]]:
        """Recupera metadatos crudos para actualización."""
        result = self.collection.get(ids=[memory_id])
        if result['metadatas']:
            return result['metadatas'][0]
        return None