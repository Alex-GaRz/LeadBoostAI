// backend/test-b4-integration.js
const analystBridge = require('./src/core/analysis/AnalystServiceBridge');

async function testIntegration() {
  console.log("🧪 Probando conexión Node.js -> Python (Bloque 4)...");

  const mockSignal = {
    id: 'integration-test-001',
    source: 'simulation',
    timestamp: new Date().toISOString(),
    content: 'Test integration signal',
    analysis: { sentimentScore: -0.95 }, // Forzamos el valor crítico
    metadata: { aiConfidence: 0.99 }
  };

  const result = await analystBridge.analyzeSignal(mockSignal);

  if (result) {
    console.log("✅ ÉXITO: Node.js recibió la alerta crítica de Python.");
    console.log(result);
  } else {
    console.log("❌ FALLO: No se recibió respuesta o alerta.");
  }
}

testIntegration();