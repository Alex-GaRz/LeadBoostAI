# Dockerfile for microservice_enterprise
# Docker Architect - Monorepo Build with Root Context
# LeadBoostAI - Fase 3 Security

FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Install Python dependencies (cache layer)
COPY microservice_enterprise/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 2. Copy service code
COPY microservice_enterprise/ .

# 3. Copy shared modules (CRITICAL for monorepo)
COPY core/ ./core/
COPY config/ ./config/

# 4. Create necessary directories
RUN mkdir -p /app/certs /app/logs

# 5. Configuration
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Expose ports
EXPOSE 8002 8011

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8002/health || exit 1

# Start application
CMD ["python", "main.py"]
