import axios from 'axios';

// PHP Resources API (port 8081)
const phpApi = axios.create({
    baseURL: import.meta.env.VITE_PHP_API_URL || 'http://localhost:8081',
    withCredentials: true,  // sends the HttpOnly 'jwt' cookie
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

export default phpApi;
