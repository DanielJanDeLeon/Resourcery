import axios from 'axios';

// Django Bookings API (port 8082)
const djangoApi = axios.create({
    baseURL: import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8082',
    withCredentials: true,  // sends the HttpOnly 'jwt' cookie
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

export default djangoApi;
