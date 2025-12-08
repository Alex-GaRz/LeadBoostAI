# Dockerfile for microservice_bff
# Docker Architect - Monorepo Build with Root Context
# LeadBoostAI - Fase 3 Security

FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Install Python dependencies (cache layer)
COPY backend/microservice_bff/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 2. Copy service code
COPY backend/microservice_bff/ .

# 3. Copy shared modules (BFF uses core.security)
COPY core/ ./core/

# 4. Copy configuration (optional, if BFF needs IAM policies)
COPY config/ ./config/

# 5. Create necessary directories
RUN mkdir -p /app/certs

# 6. Configuration
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start application
CMD ["python", "main.py"]
