import axios from 'axios';

const api = axios.create({
    // Usamos la variable de entorno de Vercel
    baseURL: process.env.REACT_APP_API_URL
});

export default api;