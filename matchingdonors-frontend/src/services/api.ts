import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || (import.meta as any).env?.VITE_API_URL || 'https://matchingdonors-demo.onrender.com' || 'http://localhost:8080';

export const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 60000, // 60 seconds for AI operations
});

// Request interceptor for debugging
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        // console.log(`[API] Response from ${response.config.url}:`, response.status);
        return response;
    },
    (error) => {
        console.error('[API] Response error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default api;