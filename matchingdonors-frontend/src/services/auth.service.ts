import axios from 'axios';
import { AuthResponse, RegisterData, User } from '../types/auth.types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const authApi = axios.create({
    baseURL: `${API_BASE_URL}/api/auth`,
    headers: {
        'Content-Type': 'application/json',
    },
});

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
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
    // Register a new user
    static async register(data: RegisterData): Promise<AuthResponse> {
        const response = await authApi.post('/register', data);
        return response.data;
    }

    // Login user
    static async login(email: string, password: string, role: 'patient' | 'donor'): Promise<AuthResponse> {
        const response = await authApi.post('/login', {
            email,
            password,
            role
        });

        if (response.data.token) {
            this.storeAuthData(response.data.token, response.data.user);
        }

        return response.data;
    }

    // Get current user info
    static async getCurrentUser(): Promise<User> {
        const response = await authApi.get('/me');
        return response.data;
    }

    // Request password reset code
    static async forgotPassword(email: string, role: 'patient' | 'donor'): Promise<{ message: string; code?: string; expiresAt?: string }> {
        const response = await authApi.post('/forgot-password', { email, role });
        return response.data;
    }

    // Verify password reset code
    static async verifyResetCode(email: string, code: string, role: 'patient' | 'donor'): Promise<{ valid: boolean; message?: string }> {
        const response = await authApi.post('/verify-code', { email, code, role });
        return response.data;
    }

    // Reset password with code
    static async resetPassword(email: string, code: string, newPassword: string, role: 'patient' | 'donor'): Promise<{ message: string }> {
        const response = await authApi.post('/reset-password', { email, code, newPassword, role });
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

    static async checkProfileCompletion(): Promise<{
        hasProfile: boolean;
        isComplete: boolean;
        profile: any | null;
    }> {
        const { token } = this.getStoredAuthData();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await axios.get(`${API_BASE_URL}/api/profile/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Backend returns { success, profile, hasCompleteProfile }
        const data = response.data;

        return {
            hasProfile: !!data.profile,
            isComplete: data.hasCompleteProfile || false,
            profile: data.profile || null,
        };
    }

    static async saveProfile(profileData: {
        summary: string;
        organType: string;
        age: string;
        bloodType: string;
        location: string;
        personalStory: string;
    }): Promise<any> {
        const { token } = this.getStoredAuthData();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await axios.post(`${API_BASE_URL}/api/profile/save`, profileData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return response.data;
    }

    static async validateInput(text: string, currentTab: string): Promise<any> {
        const { token } = this.getStoredAuthData();
        if (!token) {
            throw new Error('Not authenticated');
        }

        // const response = await api.post('/profile/validate',
        //     { text, currentTab },
        //     { headers: { Authorization: `Bearer ${token}` } }
        // );
        const response = await axios.post(`${API_BASE_URL}/api/profile/validate`,
            { text, currentTab },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        return response.data.validation;
    }
}
