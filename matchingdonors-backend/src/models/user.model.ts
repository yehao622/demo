export type UserRole = 'patient' | 'donor' | 'sponsor';

export interface User {
    id: number;
    email: string;
    password_hash: string;
    role: UserRole;
    first_name: string;
    last_name: string;
    created_at: string;
    updated_at: string;
    is_admin?: boolean | number;
    is_active?: boolean | number;
}

export interface UserResponse {
    id: number;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    is_admin?: boolean;
    is_active?: boolean;
}

export interface RegisterRequest {
    email: string;
    password: string;
    role: UserRole;
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