import axios from 'axios';
import { AuthResponse, RegisterData, LoginData, User } from '../types/auth.types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const authApi = axios.create({
    baseURL: `${API_BASE_URL}/api/auth`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if available
authApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});


export class AuthService {
    // Register a new use
    static async register(data: RegisterData): Promise<AuthResponse> {
        const response = await authApi.post<AuthResponse>('/register', data);
        return response.data;
    }

    // Login user
    static async login(data: LoginData): Promise<AuthResponse> {
        const response = await authApi.post<AuthResponse>('/login', data);
        return response.data;
    }

    // Get current use info
    static async getCurrentUser(): Promise<User> {
        const response = await authApi.get<User>('/me');
        return response.data;
    }

    // Request password reset code
    static async forgotPassword(email: string): Promise<{ message: string; code?: string; expiresAt?: string }> {
        const response = await authApi.post('/forgot-password', { email });
        return response.data;
    }

    // Verify password reset code
    static async verifyResetCode(email: string, code: string): Promise<{ valid: boolean; message?: string }> {
        const response = await authApi.post('/verify-code', { email, code });
        return response.data;
    }

    // Reset password with code
    static async resetPassword(email: string, code: string, newPassword: string): Promise<{ message: string }> {
        const response = await authApi.post('/reset-password', { email, code, newPassword });
        return response.data;
    }

    // Store auth data in localStorage
    static storeAuthData(token: string, user: User): void {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
    }

    // Get stored auth data
    static getStoredAuthData(): { token: string | null; user: User | null } {
        const token = localStorage.getItem('auth_token');
        const userStr = localStorage.getItem('auth_user');
        const user = userStr ? JSON.parse(userStr) : null;
        return { token, user };
    }

    // Clear auth data
    static clearAuthData(): void {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    }
}