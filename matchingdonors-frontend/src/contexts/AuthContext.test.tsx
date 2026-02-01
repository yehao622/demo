import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import * as AuthServiceModule from '../services/auth.service';

jest.mock('../services/auth.service');

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();

        // Reset the mock to return default values
        (AuthServiceModule.AuthService.getStoredAuthData as jest.Mock).mockReturnValue({
            token: null,
            user: null,
        });
    });

    describe('useAuth hook', () => {
        it('should throw error when used outside AuthProvider', () => {
            const originalError = console.error;
            console.error = jest.fn();

            expect(() => {
                renderHook(() => useAuth());
            }).toThrow('useAuth must be used within an AuthProvider');

            console.error = originalError;
        });

        it('should provide initial unauthenticated state', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.user).toBeNull();
            expect(result.current.token).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
        });
    });

    describe('login', () => {
        it('should login successfully', async () => {
            const mockAuthResponse = {
                token: 'test-token',
                user: {
                    id: 1,
                    email: 'test@example.com',
                    role: 'patient' as const,
                    firstName: 'John',
                    lastName: 'Doe',
                },
            };

            (AuthServiceModule.AuthService.login as jest.Mock).mockResolvedValue(mockAuthResponse);

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await act(async () => {
                await result.current.login('test@example.com', 'password123');
            });

            expect(result.current.isAuthenticated).toBe(true);
            expect(result.current.user).toEqual(mockAuthResponse.user);
            expect(result.current.token).toBe(mockAuthResponse.token);
        });

        it('should handle login failure', async () => {
            (AuthServiceModule.AuthService.login as jest.Mock).mockRejectedValue({
                response: { data: { error: 'Invalid credentials' } },
            });

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await expect(
                act(async () => {
                    await result.current.login('test@example.com', 'wrongpassword');
                })
            ).rejects.toThrow('Invalid credentials');

            expect(result.current.isAuthenticated).toBe(false);
        });
    });

    describe('register', () => {
        it('should register successfully', async () => {
            const mockAuthResponse = {
                token: 'test-token',
                user: {
                    id: 1,
                    email: 'new@example.com',
                    role: 'donor' as const,
                    firstName: 'Jane',
                    lastName: 'Smith',
                },
            };

            (AuthServiceModule.AuthService.register as jest.Mock).mockResolvedValue(mockAuthResponse);

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await act(async () => {
                await result.current.register({
                    email: 'new@example.com',
                    password: 'password123',
                    role: 'donor',
                    firstName: 'Jane',
                    lastName: 'Smith',
                });
            });

            expect(result.current.isAuthenticated).toBe(true);
            expect(result.current.user).toEqual(mockAuthResponse.user);
        });
    });

    describe('logout', () => {
        it('should logout and clear auth data', async () => {
            const mockAuthResponse = {
                token: 'test-token',
                user: {
                    id: 1,
                    email: 'test@example.com',
                    role: 'patient' as const,
                    firstName: 'John',
                    lastName: 'Doe',
                },
            };

            (AuthServiceModule.AuthService.login as jest.Mock).mockResolvedValue(mockAuthResponse);

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await act(async () => {
                await result.current.login('test@example.com', 'password123');
            });

            expect(result.current.isAuthenticated).toBe(true);

            act(() => {
                result.current.logout();
            });

            expect(result.current.isAuthenticated).toBe(false);
            expect(result.current.user).toBeNull();
            expect(result.current.token).toBeNull();
        });
    });

    describe('persistence', () => {
        it('should restore auth state from localStorage', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                role: 'patient' as const,
                firstName: 'John',
                lastName: 'Doe',
            };

            // Mock getStoredAuthData to return stored values
            (AuthServiceModule.AuthService.getStoredAuthData as jest.Mock).mockReturnValue({
                token: 'stored-token',
                user: mockUser,
            });

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
                expect(result.current.isAuthenticated).toBe(true);
                expect(result.current.token).toBe('stored-token');
                expect(result.current.user).toEqual(mockUser);
            });
        });
    });
});
