import api from './api';
import { AuthResponse, RegisterData, User, UserRole } from '../types/auth.types';

export class AuthService {
    // Register a new user
    static async register(data: RegisterData): Promise<AuthResponse> {
        const response = await api.post('/api/auth/register', data);
        return response.data;
    }

    // Login user
    static async login(email: string, password: string, role: UserRole): Promise<AuthResponse> {
        const response = await api.post('/api/auth/login', {
            email,
            password,
            role
        });

        return response.data;
    }

    // Get current user info
    static async getCurrentUser(): Promise<User> {
        const response = await api.get('/api/auth/me');
        return response.data;
    }

    // Request password reset code
    static async forgotPassword(email: string, role: UserRole): Promise<{ message: string; code?: string; expiresAt?: string }> {
        const response = await api.post('/api/auth/forgot-password', { email, role });
        return response.data;
    }

    // Verify password reset code
    static async verifyResetCode(email: string, code: string, role: UserRole): Promise<{ valid: boolean; message?: string }> {
        const response = await api.post('/api/auth/verify-code', { email, code, role });
        return response.data;
    }

    // Reset password with code
    static async resetPassword(email: string, code: string, newPassword: string, role: UserRole): Promise<{ message: string }> {
        const response = await api.post('/api/auth/reset-password', { email, code, newPassword, role });
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
        const response = await api.get('api/profile/me');
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
        isPublic: boolean;
    }): Promise<any> {
        // Parse location
        const locationParts = (profileData.location || '').split(',').map((s: string) => s.trim());
        const city = locationParts[0] || '';
        const state = locationParts[1] || '';
        const country = locationParts[2] || 'USA';

        const payload = {
            name: '',
            age: profileData.age,
            blood_type: profileData.bloodType,
            organ_type: profileData.organType,
            city,
            state,
            country,
            description: profileData.summary || '',
            medical_info: profileData.personalStory,
            preferences: '',
            is_public: profileData.isPublic,
        };

        const response = await api.post('/api/profile/save', payload);
        return response.data;
    }

    // static async validateInput(text: string, currentTab: string): Promise<any> {
    //     const response = await api.post('/api/profile/validate');
    //     return response.data.validation;
    // }

    static async validateInput(text: string, currentTab: string): Promise<any> {
        const response = await api.post('/api/profile/validate', { text, currentTab });
        return response.data.validation;
    }

    // Add this method to the AuthService class or object
    static async toggleProfileVisibility(isPublic: boolean): Promise<any> {
        try {
            const response = await api.patch('/api/profile/visibility', { isPublic });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Failed to update visibility');
        }
    }

    static async getProfile(): Promise<any> {
        try {
            const response = await api.get('/api/profile/me');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Failed to load profile');
        }
    }

    static async updateProfile(data: any): Promise<any> {
        const response = await api.put('/api/profile/update', data);
        return response.data;
    }
}
