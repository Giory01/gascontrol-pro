import axios from 'axios';

const api = axios.create({
    // Esta es la configuración correcta para DigitalOcean.
    // Usará la variable de entorno en producción y localhost en tu computadora.
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000'
});

export default api;