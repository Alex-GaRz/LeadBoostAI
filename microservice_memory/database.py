from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# CONFIGURACIÓN ENTERPRISE:
# Para Prod, cambiar esto a: "postgresql://user:pass@localhost/dbname"
SQLALCHEMY_DATABASE_URL = "sqlite:///./memory.db"

# check_same_thread=False es necesario solo para SQLite en entornos multi-hilo como FastAPI
connect_args = {"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()