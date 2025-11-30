-- Tabla para el Océano de Datos (Millones de Tweets/Posts)
CREATE TABLE IF NOT EXISTS raw_signals (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL, -- 'reddit', 'twitter', 'tiktok'
    content TEXT,
    metadata JSONB, -- Likes, shares, autor
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE
);

-- Tabla para el Historial de Entrenamiento (La "Sangre" del Optimizador)
CREATE TABLE IF NOT EXISTS training_history (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    platform VARCHAR(50),
    investment DECIMAL(10, 2),
    clicks INT,
    conversions INT,
    revenue DECIMAL(10, 2),
    roi DECIMAL(5, 2)
);

-- Tabla de Auditoría (El Ledger Inmutable)
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(50),
    action VARCHAR(100),
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para velocidad
CREATE INDEX idx_signals_processed ON raw_signals(processed);
CREATE INDEX idx_training_date ON training_history(date);