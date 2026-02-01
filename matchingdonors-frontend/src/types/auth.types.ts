export type UserRole = 'patient' | 'donor';

export interface User {
    id: number;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface RegisterData {
    email: string;
    password: string;
    role: UserRole;
    firstName: string;
    lastName: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

export interface PasswordResetData {
    email: string;
    code?: string;
    newPassword?: string;
}