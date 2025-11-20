// backend/src/core/analysis/AnalystServiceBridge.js
const axios = require('axios');

class AnalystServiceBridge {
  constructor() {
    this.pythonServiceUrl = 'http://localhost:8000/predict';
  }

  /**
   * Envía una señal procesada al Motor de Inteligencia Predictiva (Python)
   * @param {Object} signal - La señal UniversalSignal completa
   */
  async analyzeSignal(signal) {
    try {
      // Preparar el payload exacto que espera Pydantic en Python
      const payload = {
        id: signal.id || `sig-${Date.now()}`,
        source: signal.source || 'unknown',
        timestamp: signal.timestamp || new Date().toISOString(),
        content: signal.content || '',
        analysis: signal.analysis || {},
        metadata: signal.metadata || {}
      };

      console.log(`🤖 [AnalystBridge] Enviando señal ${payload.id} al Bloque 4...`);
      
      const response = await axios.post(this.pythonServiceUrl, payload);

      if (response.data.status === 'ALERT_CREATED') {
        const alert = response.data.alert;
        console.log(`🚨 [AnalystBridge] ¡ALERTA CRÍTICA RECIBIDA DEL BLOQUE 4!`);
        console.log(`   Tipo: ${alert.type} | Severidad: ${alert.severity} | Score: ${alert.anomaly_score}`);
        // AQUÍ: En el futuro (Bloque 5) esto disparará al Consejero Estratégico
        return alert;
      } else {
        console.log(`✅ [AnalystBridge] Análisis completado. Comportamiento normal.`);
        return null;
      }

    } catch (error) {
      // Fail-safe: Si el microservicio Python está apagado, no matamos el proceso Node
      if (error.code === 'ECONNREFUSED') {
        console.warn('⚠️ [AnalystBridge] El servicio Python (Bloque 4) no está disponible. Saltando análisis predictivo.');
      } else {
        console.error(`❌ [AnalystBridge] Error de comunicación: ${error.message}`);
      }
      return null;
    }
  }
}

module.exports = new AnalystServiceBridge();