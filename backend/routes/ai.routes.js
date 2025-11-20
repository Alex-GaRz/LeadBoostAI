const express = require('express');
const { OpenAI } = require('openai');
const router = express.Router();

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Endpoint proxy para generar estrategias usando OpenAI
 * Recibe CriticalAlert desde el microservice, devuelve ActionProposal
 */
router.post('/strategy', async (req, res) => {
  try {
    const { alert } = req.body;
    
    if (!alert) {
      return res.status(400).json({ error: "Alert data is required" });
    }

    // System prompt para el estratega de negocios
    const systemPrompt = `
    Eres un ESTRATEGA DE NEGOCIOS SENIOR para LeadBoostAI.
    Tu objetivo es recibir alertas de anomalías en métricas de mercado y proponer 
    acciones correctivas o de capitalización inmediatas.
    
    Tus decisiones deben ser lógicas, orientadas al ROI y ejecutables.
    
    DEBES responder EXCLUSIVAMENTE en formato JSON válido que cumpla con este esquema:
    {
        "action_type": "MARKETING_CAMPAIGN" | "PRICING_ADJUST" | "INVENTORY_CHECK",
        "priority": "HIGH" | "CRITICAL",
        "reasoning": "Breve explicación de 1 frase sobre la decisión.",
        "suggested_params": { ... objeto libre con parámetros relevantes ... }
    }
    `;

    // User content con los datos de la alerta
    const userContent = `
    ANALIZA ESTA ALERTA DEL SISTEMA RADAR:
    - ID: ${alert.alert_id}
    - Timestamp: ${alert.timestamp}
    - Métrica: ${alert.metric}
    - Valor Actual: ${alert.current_value}
    - Umbral Normal: ${alert.threshold}
    - Severidad: ${alert.severity}
    - Contexto Adicional: ${JSON.stringify(alert.context, null, 2)}

    Decide la mejor estrategia.
    `;

    // Llamada a OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    const aiResponse = completion.choices[0].message.content;
    const strategyData = JSON.parse(aiResponse);

    res.json(strategyData);

  } catch (error) {
    console.error('Error en AI Strategy:', error);
    
    if (error.name === 'SyntaxError') {
      res.status(500).json({ error: "AI returned invalid JSON" });
    } else {
      res.status(500).json({ error: "Strategy generation failed", details: error.message });
    }
  }
});

/**
 * Health check para el módulo AI
 */
router.get('/health', (req, res) => {
  res.json({
    status: "OK",
    service: "LeadBoostAI Backend AI Proxy",
    openai_configured: !!process.env.OPENAI_API_KEY
  });
});

module.exports = router;