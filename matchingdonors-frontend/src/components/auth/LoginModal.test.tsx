import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginModal } from './LoginModal';
import { AuthProvider } from '../../contexts/AuthContext';
import * as AuthServiceModule from '../../services/auth.service';

jest.mock('../../services/auth.service');

const renderWithAuth = (component: React.ReactElement) => {
    return render(<AuthProvider>{component}</AuthProvider>);
};

describe('LoginModal', () => {
    const mockOnClose = jest.fn();
    const mockOnSwitchToRegister = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (AuthServiceModule.AuthService.getStoredAuthData as jest.Mock).mockReturnValue({
            token: null,
            user: null,
        });
    });

    it('should render login form for patient', () => {
        renderWithAuth(
            <LoginModal
                role="patient"
                onClose={mockOnClose}
                onSwitchToRegister={mockOnSwitchToRegister}
            />
        );

        expect(screen.getByText(/Welcome Back, Patient!/i)).toBeInTheDocument();
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('should render login form for donor', () => {
        renderWithAuth(
            <LoginModal
                role="donor"
                onClose={mockOnClose}
                onSwitchToRegister={mockOnSwitchToRegister}
            />
        );

        expect(screen.getByText(/Welcome Back, Donor!/i)).toBeInTheDocument();
    });

    it('should handle successful login', async () => {
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

        renderWithAuth(
            <LoginModal
                role="patient"
                onClose={mockOnClose}
                onSwitchToRegister={mockOnSwitchToRegister}
            />
        );

        const emailInput = screen.getByLabelText('Email');
        const passwordInput = screen.getByLabelText('Password');
        const submitButton = screen.getByRole('button', { name: /Sign In/i });

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(AuthServiceModule.AuthService.login).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            });
        });
    });

    it('should display error message on login failure', async () => {
        (AuthServiceModule.AuthService.login as jest.Mock).mockRejectedValue({
            response: { data: { error: 'Invalid credentials' } },
        });

        renderWithAuth(
            <LoginModal
                role="patient"
                onClose={mockOnClose}
                onSwitchToRegister={mockOnSwitchToRegister}
            />
        );

        const emailInput = screen.getByLabelText('Email');
        const passwordInput = screen.getByLabelText('Password');
        const submitButton = screen.getByRole('button', { name: /Sign In/i });

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
        });
    });

    it('should switch to register modal', () => {
        renderWithAuth(
            <LoginModal
                role="patient"
                onClose={mockOnClose}
                onSwitchToRegister={mockOnSwitchToRegister}
            />
        );

        const registerLink = screen.getByText('Register here');
        fireEvent.click(registerLink);

        expect(mockOnSwitchToRegister).toHaveBeenCalled();
    });

    it('should close modal on close button click', () => {
        renderWithAuth(
            <LoginModal
                role="patient"
                onClose={mockOnClose}
                onSwitchToRegister={mockOnSwitchToRegister}
            />
        );

        const closeButton = screen.getByText('×');
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalled();
    });
});
