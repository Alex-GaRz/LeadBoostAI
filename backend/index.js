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
const { generateImage, generateImageToImage } = require('./stabilityai');

// Multer para manejo de archivos
const multer = require('multer');
const upload = multer();

app.post('/api/openai/generate-campaign', async (req, res) => {
  try {
    const result = await generateCampaignAI(req.body);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Soporta ambos: text-to-image (solo prompt) y image-to-image (prompt + archivo)
app.post('/api/stabilityai/generate-image', upload.single('init_image'), async (req, res) => {
  try {
    const prompt = req.body.prompt;
    if (req.file) {
      // image-to-image
      console.log('[IA] Generando imagen a partir de imagen de entrada');
      const image = await generateImageToImage(prompt, req.file.buffer);
      if (!image) {
        console.error('[IA] No se recibió imagen de Stability AI (image-to-image)');
        return res.status(500).json({ success: false, error: 'No se recibió imagen de la IA' });
      }
      return res.json({ success: true, image });
    } else {
      // text-to-image
      console.log('[IA] Generando imagen solo con prompt');
      const image = await generateImage(prompt);
      if (!image) {
        console.error('[IA] No se recibió imagen de Stability AI (text-to-image)');
        return res.status(500).json({ success: false, error: 'No se recibió imagen de la IA' });
      }
      return res.json({ success: true, image });
    }
  } catch (err) {
    console.error('[IA] Error al generar imagen:', err);
    res.status(500).json({ success: false, error: err.message || 'Error desconocido en el backend' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en el puerto ${PORT}`);
});
