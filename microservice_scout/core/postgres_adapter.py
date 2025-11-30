import os
import json
import logging
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

class PostgresAdapter:
    def __init__(self):
        # Configuración por defecto apuntando a Docker o Localhost
        self.db_user = os.getenv("POSTGRES_USER", "admin")
        self.db_pass = os.getenv("POSTGRES_PASSWORD", "password_seguro_123")
        self.db_host = os.getenv("POSTGRES_HOST", "localhost") # 'leadboost_db' en docker
        self.db_port = os.getenv("POSTGRES_PORT", "5432")
        self.db_name = os.getenv("POSTGRES_DB", "leadboost_cold_store")

        self.database_url = f"postgresql://{self.db_user}:{self.db_pass}@{self.db_host}:{self.db_port}/{self.db_name}"
        
        try:
            # Creamos el engine con pool de conexiones
            self.engine = create_engine(self.database_url, pool_size=10, max_overflow=20)
            self._init_tables()
            logging.info("✅ [PostgresAdapter] Conexión establecida y esquema verificado.")
        except Exception as e:
            logging.error(f"❌ [PostgresAdapter] Error crítico de conexión: {e}")
            self.engine = None

    def _init_tables(self):
        """Crea la tabla raw_signals si no existe (Defensive Coding)"""
        create_table_query = """
        CREATE TABLE IF NOT EXISTS raw_signals (
            id SERIAL PRIMARY KEY,
            source VARCHAR(50),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            payload JSONB,
            processed BOOLEAN DEFAULT FALSE
        );
        """
        with self.engine.connect() as conn:
            conn.execute(text(create_table_query))
            conn.commit()

    def save_raw_signal(self, signal: dict) -> bool:
        """Guarda cualquier señal normalizada en el Cold Storage"""
        if not self.engine:
            return False

        try:
            source = signal.get("source", "unknown")
            # Serializamos el dict a string JSON para JSONB
            payload_json = json.dumps(signal, default=str)
            
            # CORRECCIÓN APLICADA: 'payload' escrito correctamente
            query = text("INSERT INTO raw_signals (source, payload) VALUES (:src, :pay)")
            
            with self.engine.connect() as conn:
                conn.execute(query, {"src": source, "pay": payload_json})
                conn.commit()
            return True
        except SQLAlchemyError as e:
            logging.error(f"⚠️ [PostgresAdapter] Error guardando señal: {e}")
            return False