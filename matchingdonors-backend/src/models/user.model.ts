export interface User {
    id: number;
    email: string;
    password_hash: string;
    role: 'patient' | 'donor';
    first_name: string;
    last_name: string;
    created_at: string;
    updated_at: string;
}

export interface UserResponse {
    id: number;
    email: string;
    role: 'patient' | 'donor';
    firstName: string;
    lastName: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    role: 'patient' | 'donor';
    firstName: string;
    lastName: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: UserResponse;
}

export interface PasswordResetCode {
    id: number;
    user_id: number;
    code: string;
    expires_at: string;
    used: boolean;
    created_at: string;
}