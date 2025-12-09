# Dockerfile for Actuator Microservice (Phase 4)
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port 8003 (Actuator's designated port)
EXPOSE 8003

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8003/api/v1/actuator/health')"

# Run the application
CMD ["python", "main.py"]
