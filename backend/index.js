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

    // --- CÓDIGO A AÑADIR ---
    console.log('--- PROMPT FINAL RECIBIDO POR EL BACKEND ---');
    console.log(prompt);
    console.log('--------------------------------------------');
    // --- FIN DEL CÓDIGO A AÑADIR ---
    let imageBase64;
    if (req.file) {
      // Escenario 1: inpainting/composición
      console.log('[IA] Se recibió una imagen de referencia. Procediendo a generar imagen con prompt + imagen (inpainting/composición).');
      // Convertir buffer a base64
      const imageBuffer = req.file.buffer;
      const imageMime = req.file.mimetype || 'image/png';
      const imageBase64String = imageBuffer.toString('base64');
      // Llamar a Vertex AI con prompt + imagen
      imageBase64 = await generateImageWithVertexAI(prompt, imageBase64String, imageMime);
    } else {
      // Escenarios text-to-image
      console.log('[IA] Generando imagen solo con prompt usando Vertex AI');
      imageBase64 = await generateImageWithVertexAI(prompt);
    }
    if (!imageBase64) {
      console.error('[IA] No se recibió imagen de Vertex AI');
      return res.status(500).json({ success: false, error: 'No se recibió imagen de la IA' });
    }
    // Devolvemos la imagen en base64
    return res.json({ success: true, image: imageBase64 });

  } catch (err) {
    console.error('[IA] Error al generar imagen con Vertex AI:', err);
    res.status(500).json({ success: false, error: err.message || 'Error desconocido en el backend' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en el puerto ${PORT}`);
});
