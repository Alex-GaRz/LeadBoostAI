#!/bin/bash
# Script de Inicialización del Memory Service - FASE 6.1

echo "============================================"
echo "Memory Service - FASE 6.1 Initialization"
echo "============================================"
echo ""

# Verificar Python
echo "1. Verificando Python..."
python3 --version || {
    echo "❌ Python 3.11+ no encontrado"
    exit 1
}
echo "✅ Python OK"
echo ""

# Crear entorno virtual
echo "2. Creando entorno virtual..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Entorno virtual creado"
else
    echo "✅ Entorno virtual ya existe"
fi
echo ""

# Activar entorno
echo "3. Activando entorno..."
source venv/bin/activate || source venv/Scripts/activate
echo "✅ Entorno activado"
echo ""

# Instalar dependencias
echo "4. Instalando dependencias..."
pip install --upgrade pip
pip install -r requirements.txt
echo "✅ Dependencias instaladas"
echo ""

# Crear directorio ChromaDB
echo "5. Creando directorio ChromaDB..."
mkdir -p ./chroma_db
echo "✅ Directorio creado"
echo ""

# Copiar .env si no existe
echo "6. Configurando variables de entorno..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "⚠️  Archivo .env creado desde .env.example"
    echo "⚠️  IMPORTANTE: Edita .env y agrega tu OPENAI_API_KEY"
else
    echo "✅ Archivo .env ya existe"
fi
echo ""

# Verificar configuración
echo "7. Verificando configuración..."
if grep -q "your-openai-api-key-here" .env 2>/dev/null; then
    echo "⚠️  WARNING: OPENAI_API_KEY no configurada"
    echo "   El servicio usará embeddings locales (fallback)"
else
    echo "✅ Configuración lista"
fi
echo ""

echo "============================================"
echo "✅ Inicialización completa"
echo "============================================"
echo ""
echo "Para iniciar el servicio:"
echo "  source venv/bin/activate  # Linux/Mac"
echo "  venv\\Scripts\\activate     # Windows"
echo "  python main.py"
echo ""
echo "Documentación API:"
echo "  http://localhost:8006/docs"
echo ""
