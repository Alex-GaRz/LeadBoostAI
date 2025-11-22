import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone

class DBAdapter:
    """
    Adaptador Fail-Safe para Firestore.
    Maneja la persistencia de señales recolectadas por el Scout.
    """
    
    def __init__(self, key_path="serviceAccountKey.json"):
        self.db = None
        self.collection_name = "signals"
        self.simulation_mode = False

        print("🔌 [DBAdapter] Inicializando conexión a Firestore...")

        if not os.path.exists(key_path):
            print(f"⚠️ [DBAdapter] No se encontró {key_path}. Modo SIMULACIÓN activado (Solo logs).")
            self.simulation_mode = True
            return

        try:
            # Evitar doble inicialización
            if not firebase_admin._apps:
                cred = credentials.Certificate(key_path)
                firebase_admin.initialize_app(cred)
            
            self.db = firestore.client()
            print("✅ [DBAdapter] Conexión establecida exitosamente.")
        except Exception as e:
            print(f"❌ [DBAdapter] Error crítico conectando a Firebase: {e}")
            self.simulation_mode = True

    def save_signal(self, signal_data: dict) -> bool:
        """
        Guarda una señal normalizada en Firestore.
        """
        if self.simulation_mode:
            print(f"💾 [SIMULACIÓN] Guardando señal: {signal_data.get('source')} | {signal_data.get('content')[:50]}...")
            return True

        try:
            # Usar un ID determinístico si viene en los datos, o dejar que Firestore genere uno
            doc_ref = self.db.collection(self.collection_name).document()
            
            # Asegurar timestamps nativos de Firestore
            signal_data['ingested_at'] = firestore.SERVER_TIMESTAMP
            
            doc_ref.set(signal_data)
            print(f"✅ [DBAdapter] Señal guardada ID: {doc_ref.id} | Fuente: {signal_data.get('source')}")
            return True
        except Exception as e:
            print(f"⚠️ [DBAdapter] Error guardando señal: {e}")
            return False
