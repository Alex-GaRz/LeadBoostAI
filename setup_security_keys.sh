#!/bin/bash

# ============================================================
# FASE 3: SECURITY KEY GENERATION SCRIPT
# LeadBoostAI - RFC-PHOENIX-03
# ============================================================
# 
# Este script genera automáticamente:
# 1. Claves RSA 2048 para el Security Token Service (STS)
# 2. Client secrets aleatorios para autenticación entre servicios
# 3. Configuración .env.security lista para usar
#
# Uso:
#   chmod +x setup_security_keys.sh
#   ./setup_security_keys.sh
#
# ============================================================

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║   LeadBoostAI - Security Keys Setup (Fase 3)          ║"
echo "║   RFC-PHOENIX-03: IAM, Secrets & mTLS                  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar OpenSSL
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}❌ ERROR: OpenSSL no está instalado.${NC}"
    echo "   Instalar con: apt-get install openssl (Debian/Ubuntu)"
    echo "                 yum install openssl (RHEL/CentOS)"
    echo "                 brew install openssl (macOS)"
    exit 1
fi

# Variables
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERTS_DIR="${PROJECT_ROOT}/certs"
STS_CERTS_DIR="${CERTS_DIR}/sts"
ENV_FILE="${PROJECT_ROOT}/.env.security"
ENV_EXAMPLE="${PROJECT_ROOT}/.env.security.example"
GITIGNORE="${PROJECT_ROOT}/.gitignore"

echo -e "${BLUE}📁 Directorio del proyecto:${NC} ${PROJECT_ROOT}"
echo ""

# ============================================================
# PASO 1: Crear directorio de certificados
# ============================================================
echo -e "${YELLOW}[1/5] Creando estructura de directorios...${NC}"

if [ -d "$CERTS_DIR" ]; then
    echo -e "   ℹ️  Directorio ${CERTS_DIR} ya existe"
else
    mkdir -p "$STS_CERTS_DIR"
    echo -e "   ${GREEN}✓${NC} Creado: ${CERTS_DIR}"
    echo -e "   ${GREEN}✓${NC} Creado: ${STS_CERTS_DIR}"
fi

# Asegurar subdirectorios
mkdir -p "$STS_CERTS_DIR"

# ============================================================
# PASO 2: Actualizar .gitignore
# ============================================================
echo -e "${YELLOW}[2/5] Actualizando .gitignore...${NC}"

GITIGNORE_ENTRIES=(
    "# Fase 3: Security Keys & Certificates"
    "certs/"
    "*.pem"
    "*.key"
    "*.crt"
    ".env.security"
)

# Verificar si ya existe la entrada
if grep -q "certs/" "$GITIGNORE" 2>/dev/null; then
    echo -e "   ℹ️  .gitignore ya contiene protección para certs/"
else
    echo "" >> "$GITIGNORE"
    for entry in "${GITIGNORE_ENTRIES[@]}"; do
        echo "$entry" >> "$GITIGNORE"
    done
    echo -e "   ${GREEN}✓${NC} .gitignore actualizado"
fi

# ============================================================
# PASO 3: Generar claves RSA para STS
# ============================================================
echo -e "${YELLOW}[3/5] Generando par de claves RSA 2048 para STS...${NC}"

PRIVATE_KEY="${STS_CERTS_DIR}/sts_private.pem"
PUBLIC_KEY="${STS_CERTS_DIR}/sts_public.pem"

# Generar clave privada RSA 2048
openssl genrsa -out "$PRIVATE_KEY" 2048 2>/dev/null
# chmod 600 "$PRIVATE_KEY"  # Solo lectura para propietario (comentado para Windows/WSL)
echo -e "   ${GREEN}✓${NC} Clave privada: ${PRIVATE_KEY}"

# Extraer clave pública
openssl rsa -in "$PRIVATE_KEY" -pubout -out "$PUBLIC_KEY" 2>/dev/null
# chmod 644 "$PUBLIC_KEY"  # Solo lectura para propietario (comentado para Windows/WSL)
echo -e "   ${GREEN}✓${NC} Clave pública: ${PUBLIC_KEY}"

# Generar Key ID único
KEY_ID="key-$(date +%s)"
echo -e "   ${GREEN}✓${NC} Key ID: ${KEY_ID}"

# ============================================================
# PASO 4: Generar Client Secrets
# ============================================================
echo -e "${YELLOW}[4/5] Generando client secrets para servicios...${NC}"

# Servicios que requieren secrets
SERVICES=(
    "ENTERPRISE"
    "ACTUATOR"
    "ANALYST"
    "OPTIMIZER"
    "MEMORY"
    "BFF"
    "SCOUT"
)

declare -A SERVICE_SECRETS

for service in "${SERVICES[@]}"; do
    # Generar 32 bytes aleatorios en hexadecimal
    SECRET=$(openssl rand -hex 32)
    SERVICE_SECRETS[$service]=$SECRET
    echo -e "   ${GREEN}✓${NC} ${service}_CLIENT_SECRET generado"
done

# ============================================================
# PASO 5: Crear archivo .env.security
# ============================================================
echo -e "${YELLOW}[5/5] Creando archivo .env.security...${NC}"

if [ -f "$ENV_FILE" ]; then
    BACKUP="${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    mv "$ENV_FILE" "$BACKUP"
    echo -e "   ℹ️  Backup creado: ${BACKUP}"
fi

# Copiar desde .env.security.example si existe
if [ -f "$ENV_EXAMPLE" ]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    echo -e "   ${GREEN}✓${NC} Copiado desde .env.security.example"
else
    # Crear archivo básico
    cat > "$ENV_FILE" << 'ENVEOF'
# ============================================================
# FASE 3: SECURITY CONFIGURATION
# Generado automáticamente por setup_security_keys.sh
# ============================================================

# --- SECRET MANAGEMENT ---
SECRET_PROVIDER=local

# --- MUTUAL TLS (mTLS) ---
MTLS_ENABLED=false
MTLS_MODE=permissive

# --- SECURITY TOKEN SERVICE (STS) ---
STS_URL=http://enterprise:8011/sts/token
TOKEN_EXPIRATION_MINUTES=15

# --- IAM / RBAC ---
AUDIT_LEVEL=all
DEFAULT_IAM_POLICY=deny

# --- LOGGING ---
LOG_LEVEL=INFO
LOG_FORMAT=json

# --- FEATURE FLAGS ---
SECURITY_ENABLED=true
JWT_VALIDATION_ENABLED=true
RBAC_ENFORCEMENT_ENABLED=true
AUDIT_ENABLED=true

ENVEOF
    echo -e "   ${GREEN}✓${NC} Archivo base creado"
fi

# Reemplazar o agregar secrets
echo "" >> "$ENV_FILE"
echo "# --- STS RSA KEYS (Generated: $(date)) ---" >> "$ENV_FILE"
echo "STS_PRIVATE_KEY_PATH=${PRIVATE_KEY}" >> "$ENV_FILE"
echo "STS_PUBLIC_KEY_PATH=${PUBLIC_KEY}" >> "$ENV_FILE"
echo "STS_KEY_ID=${KEY_ID}" >> "$ENV_FILE"
echo "" >> "$ENV_FILE"
echo "# --- SERVICE CLIENT SECRETS (Generated: $(date)) ---" >> "$ENV_FILE"

for service in "${SERVICES[@]}"; do
    echo "${service}_CLIENT_SECRET=${SERVICE_SECRETS[$service]}" >> "$ENV_FILE"
done
# chmod 600 "$ENV_FILE"  # Solo lectura/escritura para propietario (comentado para Windows/WSL)
echo -e "   ${GREEN}✓${NC} Archivo creado: ${ENV_FILE}"

# ============================================================
# RESUMEN Y PRÓXIMOS PASOS
# ============================================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║             ✓ CONFIGURACIÓN COMPLETADA                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📦 Archivos generados:${NC}"
echo "   ├── ${PRIVATE_KEY}"
echo "   ├── ${PUBLIC_KEY}"
echo "   └── ${ENV_FILE}"
echo ""
echo -e "${BLUE}🔐 Secrets generados:${NC}"
for service in "${SERVICES[@]}"; do
    echo "   ├── ${service}_CLIENT_SECRET: ${SERVICE_SECRETS[$service]:0:16}..."
done
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE - PRÓXIMOS PASOS:${NC}"
echo ""
echo "1️⃣  Verificar configuración:"
echo "   ${BLUE}cat .env.security${NC}"
echo ""
echo "2️⃣  Configurar STS en microservice_enterprise:"
echo "   ${BLUE}# En microservice_enterprise/main.py${NC}"
echo "   ${BLUE}# Asegurar que el STS carga las claves desde:${NC}"
echo "   ${BLUE}# - STS_PRIVATE_KEY_PATH=${PRIVATE_KEY}${NC}"
echo "   ${BLUE}# - STS_PUBLIC_KEY_PATH=${PUBLIC_KEY}${NC}"
echo ""
echo "3️⃣  Iniciar servicios:"
echo "   ${BLUE}docker-compose up -d${NC}"
echo "   ${BLUE}# O para microservicios individuales:${NC}"
echo "   ${BLUE}cd microservice_enterprise && uvicorn main:app --reload${NC}"
echo ""
echo "4️⃣  Validar configuración de seguridad:"
echo "   ${BLUE}python scripts/validate_fase3.py${NC}"
echo ""
echo "5️⃣  Probar autenticación:"
echo "   ${BLUE}curl -X POST http://localhost:8011/sts/token \\${NC}"
echo "   ${BLUE}  -H 'Content-Type: application/json' \\${NC}"
echo "   ${BLUE}  -d '{\"service_id\":\"svc.actuator\",\"client_secret\":\"'${SERVICE_SECRETS[ACTUATOR]}'\"}' ${NC}"
echo ""
echo -e "${RED}🚨 SEGURIDAD:${NC}"
echo "   • NUNCA commitear .env.security a Git"
echo "   • NUNCA compartir los client_secrets por canales inseguros"
echo "   • En producción: migrar a HashiCorp Vault o AWS KMS"
echo "   • Rotar secrets cada 30-90 días"
echo "   • Cambiar MTLS_MODE=strict en producción"
echo ""
echo -e "${GREEN}✨ Setup completado exitosamente!${NC}"
echo ""
