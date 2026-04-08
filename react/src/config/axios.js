import axios from 'axios';

// Spring Boot auth service (port 8080)
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
    withCredentials: true,  // sends the HttpOnly 'jwt' cookie
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

export default api;
