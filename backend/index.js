// backend/index.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend funcionando y seguro!');
});



const { generateCampaignAI } = require('./openai');
const { generateImageWithVertexAI } = require('./vertexai');

// Multer para manejo de archivos
const multer = require('multer');
const upload = multer();

app.post('/api/openai/generate-campaign', async (req, res) => {
  try {
    // Permitir que el frontend indique si espera JSON o texto plano
    const expectJson = req.body.expectJson !== false; // por defecto true
    const result = await generateCampaignAI(req.body, expectJson);
    res.json({ success: true, result });
  } catch (err) {
    console.error('[OpenAI] Error completo:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Soporta ambos: text-to-image (solo prompt) y image-to-image (prompt + archivo)
app.post('/api/vertexai/generate-image', upload.single('init_image'), async (req, res) => {
  try {
    const prompt = req.body.prompt;
    
    // Por ahora, solo implementamos text-to-image con Vertex AI
    if (req.file) {
      // Lógica para image-to-image (si se necesita en el futuro con Vertex)
      console.log('[IA] Funcionalidad image-to-image con Vertex AI no implementada en este ejemplo.');
      return res.status(501).json({ success: false, error: 'Image-to-image no implementado para Vertex AI.' });
    } else {
      // text-to-image
      console.log('[IA] Generando imagen solo con prompt usando Vertex AI');
      const imageBase64 = await generateImageWithVertexAI(prompt);
      if (!imageBase64) {
        console.error('[IA] No se recibió imagen de Vertex AI (text-to-image)');
        return res.status(500).json({ success: false, error: 'No se recibió imagen de la IA' });
      }
      // Devolvemos la imagen en base64
      return res.json({ success: true, image: imageBase64 });
    }
  } catch (err) {
    console.error('[IA] Error al generar imagen con Vertex AI:', err);
    res.status(500).json({ success: false, error: err.message || 'Error desconocido en el backend' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en el puerto ${PORT}`);
});
