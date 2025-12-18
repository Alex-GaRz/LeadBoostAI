# Dockerfile para Memory Service - FASE 6.1

FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .

# Instalar dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY . .

# Crear directorio para ChromaDB
RUN mkdir -p ./chroma_db

# Exponer puerto
EXPOSE 8006

# Variables de entorno por defecto
ENV SERVICE_NAME=microservice_memory
ENV SERVICE_VERSION=6.1.0
ENV HOST=0.0.0.0
ENV PORT=8006
ENV LOG_LEVEL=INFO

# Comando de inicio
CMD ["python", "main.py"]
