import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { AuthService } from '../services/auth.service';
import { User, RegisterData, AuthContextType } from '../types/auth.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load auth data from localStorage on mount
    useEffect(() => {
        const { token: storedToken, user: storedUser } = AuthService.getStoredAuthData();
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(storedUser);
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string, role: 'patient' | 'donor'): Promise<void> => {
        try {
            const response = await AuthService.login(email, password, role);
            setToken(response.token);
            setUser(response.user);
            AuthService.storeAuthData(response.token, response.user);
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Login failed');
        }
    };

    const register = async (data: RegisterData): Promise<void> => {
        try {
            const response = await AuthService.register(data);
            setToken(response.token);
            setUser(response.user);
            AuthService.storeAuthData(response.token, response.user);
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Registration failed');
        }
    };

    const logout = (): void => {
        setToken(null);
        setUser(null);
        AuthService.clearAuthData();
    };

    const refreshUser = async (): Promise<void> => {
        try {
            if (!token) return;
            const updatedUser = await AuthService.getCurrentUser();
            setUser(updatedUser);
            AuthService.storeAuthData(token, updatedUser);
        } catch (error) {
            // Token might be expired, log out
            logout();
        }
    };

    const value: AuthContextType = {
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};