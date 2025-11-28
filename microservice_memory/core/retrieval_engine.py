import logging
from typing import List, Dict, Any
from datetime import datetime
from .vector_store import ChromaDBAdapter

logger = logging.getLogger(__name__)

class StrategicRetriever:
    def __init__(self):
        self.db_adapter = ChromaDBAdapter()
        
    def retrieve_strategy(self, query_text: str, current_context: Dict[str, Any], top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Recuperación semántica + Re-ranking basado en Trust Score y Contexto Temporal.
        """
        try:
            # 1. Generar embedding de la consulta actual (situación de mercado)
            query_vector = self.db_adapter.generate_embedding(query_text)
            
            # 2. Búsqueda Vectorial Cruda (Top K * 3 para tener margen de filtrado)
            raw_results = self.db_adapter.collection.query(
                query_embeddings=[query_vector],
                n_results=top_k * 4
                # Podríamos añadir where={"trust_score": {"$gt": 0.2}} aquí si Chroma lo soporta nativamente
            )
            
            if not raw_results['ids'][0]:
                return []

            candidates = []
            
            # Desempaquetar resultados de Chroma
            ids = raw_results['ids'][0]
            metadatas = raw_results['metadatas'][0]
            documents = raw_results['documents'][0]
            distances = raw_results['distances'][0]

            # 3. Lógica de Re-ranking
            current_month = datetime.now().month
            
            for i, doc_id in enumerate(ids):
                meta = metadatas[i]
                trust_score = meta.get('trust_score', 1.0)
                
                # A. Filtrado de memorias tóxicas
                if trust_score < 0.4:
                    logger.debug(f"🗑️ Dropping toxic memory {doc_id} (Score: {trust_score})")
                    continue
                
                # B. Cálculo de Score Híbrido
                # Distancia coseno (0 es idéntico, 1 es diferente). Convertimos a similitud.
                similarity = 1 - distances[i] 
                
                # C. Boost Temporal (Si la memoria es de la misma estación)
                memory_month = meta.get('month', -1)
                temporal_boost = 1.0
                if memory_month != -1:
                    # Si está dentro de un rango de 1 mes
                    if abs(memory_month - current_month) <= 1:
                        temporal_boost = 1.15 # +15% relevancia
                        
                final_ranking_score = similarity * trust_score * temporal_boost
                
                candidates.append({
                    "id": doc_id,
                    "strategy_text": documents[i],
                    "metadata": meta,
                    "final_score": final_ranking_score,
                    "raw_similarity": similarity
                })

            # 4. Ordenar por score final y cortar
            candidates.sort(key=lambda x: x['final_score'], reverse=True)
            
            return candidates[:top_k]

        except Exception as e:
            logger.error(f"❌ Error in retrieval strategy: {e}")
            return []

    def process_feedback(self, memory_id: str, real_outcome: float, expected_outcome: float):
        """
        Loop de Auto-Corrección (Reinforcement Learning Lite).
        Ajusta el trust_score basado en la precisión de la predicción.
        """
        try:
            # Calcular error porcentual
            if expected_outcome == 0: expected_outcome = 0.001 # Evitar div by zero
            delta = (real_outcome - expected_outcome) / expected_outcome
            
            # Obtener metadatos actuales
            current_meta = self.db_adapter.get_memory_metadata(memory_id)
            if not current_meta:
                logger.warning(f"⚠️ Memory {memory_id} not found for feedback.")
                return

            current_score = float(current_meta.get('trust_score', 1.0))
            new_score = current_score

            # Lógica de Recompensa / Castigo
            if delta < -0.2: 
                # Fracaso significativo (rendimiento 20% peor de lo esperado)
                # Castigo severo para olvidar rápido malas ideas
                new_score *= 0.8 
                action = "PUNISH 📉"
            elif delta > 0.05:
                # Éxito (superó expectativas)
                new_score *= 1.05
                # Cap en 2.0
                new_score = min(new_score, 2.0)
                action = "REWARD 📈"
            else:
                action = "NEUTRAL 😐"

            # Actualizar en Chroma
            # Nota: Chroma requiere re-insertar para actualizar metadatos
            # Obtenemos el texto original (costoso, pero necesario sin cache externo)
            # En producción, usaríamos un Redis cache para evitar leer Chroma
            doc_data = self.db_adapter.collection.get(ids=[memory_id])
            if doc_data['documents']:
                text = doc_data['documents'][0]
                self.db_adapter.add_memory(memory_id, text, current_meta, new_score)
                logger.info(f"Feedback Processed for {memory_id}: {action} | Old: {current_score:.2f} -> New: {new_score:.2f}")

        except Exception as e:
            logger.error(f"❌ Feedback processing failed: {e}")