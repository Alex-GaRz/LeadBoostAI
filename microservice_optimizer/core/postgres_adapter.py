import os
import json
import logging
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

class PostgresAdapter:
    def __init__(self):
        self.db_user = os.getenv("POSTGRES_USER", "admin")
        self.db_pass = os.getenv("POSTGRES_PASSWORD", "password_seguro_123")
        self.db_host = os.getenv("POSTGRES_HOST", "localhost")
        self.db_port = os.getenv("POSTGRES_PORT", "5432")
        self.db_name = os.getenv("POSTGRES_DB", "leadboost_cold_store")
        self.database_url = f"postgresql://{self.db_user}:{self.db_pass}@{self.db_host}:{self.db_port}/{self.db_name}"
        try:
            self.engine = create_engine(self.database_url, pool_size=10, max_overflow=20)
            self._init_tables()
            logging.info("✅ [PostgresAdapter] Conexión establecida y esquema verificado.")
        except Exception as e:
            logging.error(f"❌ [PostgresAdapter] Error crítico de conexión: {e}")
            self.engine = None

    def _init_tables(self):
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
        if not self.engine:
            return False
        try:
            source = signal.get("source", "unknown")
            payload_json = json.dumps(signal, default=str)
            query = text("INSERT INTO raw_signals (source, payload) VALUES (:src, :pay)")
            with self.engine.connect() as conn:
                conn.execute(query, {"src": source, "pay": payload_json})
                conn.commit()
            return True
        except SQLAlchemyError as e:
            logging.error(f"⚠️ [PostgresAdapter] Error guardando señal: {e}")
            return False

    def fetch_pending_signals(self, limit=50):
        """Recupera señales que aún no han sido procesadas por el cerebro"""
        if not self.engine: return []
        query = text("""
            SELECT id, source, payload 
            FROM raw_signals 
            WHERE processed = FALSE 
            ORDER BY timestamp ASC 
            LIMIT :lim
        """)
        with self.engine.connect() as conn:
            result = conn.execute(query, {"lim": limit})
            rows = [{"id": row[0], "source": row[1], "payload": row[2]} for row in result]
            return rows

    def mark_as_processed(self, signal_ids):
        """Marca las señales como 'aprendidas' para no repetir"""
        if not self.engine or not signal_ids: return
        query = text("UPDATE raw_signals SET processed = TRUE WHERE id IN :ids")
        with self.engine.connect() as conn:
            conn.execute(query, {"ids": tuple(signal_ids)})
            conn.commit()