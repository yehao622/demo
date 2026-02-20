export type UserRole = 'patient' | 'donor' | 'sponsor';

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

export interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string, role: UserRole) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    pendingRegistration: { role: UserRole } | null;
    triggerRegistration: (role: UserRole) => void;
    clearPendingRegistration: () => void;
}