#!/bin/bash

# ============================================================
# FIX DOCKER BUILD SCRIPT
# LeadBoostAI - Fase 3 Security
# ============================================================
# 
# Este script corrige los problemas de build de Docker:
# 1. Crea Dockerfile para microservice_enterprise
# 2. Crea Dockerfile para microservice_bff (si no existe)
# 3. Actualiza docker-compose.yml con build context correcto
#
# ============================================================

set -e  # Exit on error

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║          Docker Build Fix - LeadBoostAI               ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ============================================================
# PASO 1: Crear Dockerfile para microservice_enterprise
# ============================================================
echo -e "${YELLOW}[1/3] Creando Dockerfile para microservice_enterprise...${NC}"

ENTERPRISE_DOCKERFILE="${PROJECT_ROOT}/microservice_enterprise/Dockerfile"

cat > "$ENTERPRISE_DOCKERFILE" << 'DOCKERFILE'
# Dockerfile para microservice_enterprise
# Fase 3: Security Token Service (STS) + Enterprise Nervous System

FROM python:3.11-slim

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar requirements y instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Instalar dependencias de seguridad de Fase 3
RUN pip install --no-cache-dir \
    PyJWT>=2.8.0 \
    cryptography>=41.0.0 \
    httpx>=0.25.0 \
    PyYAML>=6.0.1

# Copiar código del microservicio
COPY microservice_enterprise/ ./microservice_enterprise/

# Copiar módulos de seguridad compartidos
COPY core/ ./core/

# Copiar configuración
COPY config/ ./config/

# Crear directorios para certificados y logs
RUN mkdir -p /app/certs /app/logs

# Exponer puertos
EXPOSE 8002 8011

# Variables de entorno por defecto
ENV PYTHONPATH=/app
ENV PORT=8002
ENV STS_PORT=8011

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8002/health || exit 1

# Comando de inicio
CMD ["python", "microservice_enterprise/main.py"]
DOCKERFILE

echo -e "   ${GREEN}✓${NC} Creado: ${ENTERPRISE_DOCKERFILE}"

# ============================================================
# PASO 2: Crear Dockerfile para microservice_bff
# ============================================================
echo -e "${YELLOW}[2/3] Creando Dockerfile para microservice_bff...${NC}"

BFF_DOCKERFILE="${PROJECT_ROOT}/backend/microservice_bff/Dockerfile"

# Verificar si ya existe
if [ -f "$BFF_DOCKERFILE" ]; then
    echo -e "   ℹ️  ${BFF_DOCKERFILE} ya existe, creando backup..."
    cp "$BFF_DOCKERFILE" "${BFF_DOCKERFILE}.backup.$(date +%Y%m%d_%H%M%S)"
fi

cat > "$BFF_DOCKERFILE" << 'DOCKERFILE'
# Dockerfile para microservice_bff
# Fase 3: Security Integration

FROM python:3.11-slim

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar requirements del BFF
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Instalar dependencias de seguridad de Fase 3
RUN pip install --no-cache-dir \
    PyJWT>=2.8.0 \
    cryptography>=41.0.0 \
    httpx>=0.25.0 \
    PyYAML>=6.0.1

# Copiar código del BFF
COPY . ./microservice_bff/

# Copiar módulos de seguridad compartidos desde raíz del proyecto
# NOTA: Estos se copian desde el contexto de build (./backend)
# Si core/ está en la raíz, ajustar el docker-compose context

# Crear directorios para certificados
RUN mkdir -p /app/certs

# Exponer puerto
EXPOSE 8000

# Variables de entorno por defecto
ENV PYTHONPATH=/app
ENV PORT=8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Comando de inicio
CMD ["uvicorn", "microservice_bff.main:app", "--host", "0.0.0.0", "--port", "8000"]
DOCKERFILE

echo -e "   ${GREEN}✓${NC} Creado: ${BFF_DOCKERFILE}"

# ============================================================
# PASO 3: Actualizar docker-compose.yml
# ============================================================
echo -e "${YELLOW}[3/3] Actualizando docker-compose.yml...${NC}"

DOCKER_COMPOSE="${PROJECT_ROOT}/docker-compose.yml"

# Crear backup
cp "$DOCKER_COMPOSE" "${DOCKER_COMPOSE}.backup.$(date +%Y%m%d_%H%M%S)"

# Usar sed para actualizar build context de enterprise
# Reemplazar:
#   build:
#     context: .
#     dockerfile: microservice_enterprise/Dockerfile
# Por:
#   build:
#     context: ./microservice_enterprise
#     dockerfile: Dockerfile

sed -i.tmp '/enterprise:/,/build:/{
  /build:/,/dockerfile:/{
    s|context: \.|context: ./microservice_enterprise|
    s|dockerfile: microservice_enterprise/Dockerfile|dockerfile: Dockerfile|
  }
}' "$DOCKER_COMPOSE"

# Usar sed para actualizar build context de bff
# Reemplazar:
#   build:
#     context: ./backend
#     dockerfile: microservice_bff/Dockerfile
# Por:
#   build:
#     context: ./backend/microservice_bff
#     dockerfile: Dockerfile

sed -i.tmp '/bff:/,/build:/{
  /build:/,/dockerfile:/{
    s|context: \./backend|context: ./backend/microservice_bff|
    s|dockerfile: microservice_bff/Dockerfile|dockerfile: Dockerfile|
  }
}' "$DOCKER_COMPOSE"

# Limpiar archivos temporales de sed
rm -f "${DOCKER_COMPOSE}.tmp"

echo -e "   ${GREEN}✓${NC} Actualizado: ${DOCKER_COMPOSE}"
echo -e "   ${GREEN}✓${NC} Backup creado: ${DOCKER_COMPOSE}.backup.*"

# ============================================================
# RESUMEN
# ============================================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                FIX COMPLETED                           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📦 Archivos creados:${NC}"
echo "   ├── microservice_enterprise/Dockerfile"
echo "   └── backend/microservice_bff/Dockerfile"
echo ""
echo -e "${BLUE}📝 Archivos actualizados:${NC}"
echo "   └── docker-compose.yml"
echo ""
echo -e "${BLUE}🚀 Próximos pasos:${NC}"
echo "   1. Verificar los Dockerfiles generados"
echo "   2. Ejecutar: docker compose up --build -d postgres_db redis_bus enterprise bff"
echo ""
