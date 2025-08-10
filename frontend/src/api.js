import axios from 'axios';

// Esta instancia de axios se encargará de usar la URL correcta automáticamente.
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000'
});

export default api;