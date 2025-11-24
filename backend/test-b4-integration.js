const axios = require('axios');

(async () => {
  try {
    const response = await axios.get('http://localhost:8001/api/analyst/search?query=AI+Tools');
    console.log('Respuesta del microservicio analyst:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Error de respuesta:', error.response.status, error.response.data);
    } else {
      console.error('Error comunicando con analyst:', error.message);
    }
  }
})();
