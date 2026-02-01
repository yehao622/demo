import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthGate } from './AuthGate';
import { AuthProvider } from '../../contexts/AuthContext';
import * as AuthServiceModule from '../../services/auth.service';

jest.mock('../../services/auth.service');

const renderWithAuth = (
    component: React.ReactElement,
    initialStoredAuth?: { token: string; user: any }
) => {
    if (initialStoredAuth) {
        (AuthServiceModule.AuthService.getStoredAuthData as jest.Mock).mockReturnValue(initialStoredAuth);
    } else {
        (AuthServiceModule.AuthService.getStoredAuthData as jest.Mock).mockReturnValue({
            token: null,
            user: null,
        });
    }
    return render(<AuthProvider>{component}</AuthProvider>);
};

describe('AuthGate', () => {
    const mockChildren = <div>Protected Content</div>;

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    it('should show role selection when not authenticated', async () => {
        renderWithAuth(<AuthGate>{mockChildren}</AuthGate>);

        await screen.findByText('🏥 Welcome to MatchingDonors');

        expect(screen.getByText('🏥 Welcome to MatchingDonors')).toBeInTheDocument();
        expect(screen.getByText("I'm a Patient")).toBeInTheDocument();
        expect(screen.getByText("I'm a Donor")).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should show protected content when authenticated with correct role', async () => {
        const storedAuth = {
            token: 'test-token',
            user: {
                id: 1,
                email: 'test@example.com',
                role: 'patient',
                firstName: 'John',
                lastName: 'Doe',
            },
        };

        renderWithAuth(
            <AuthGate requiredRoles={['patient']}>{mockChildren}</AuthGate>,
            storedAuth
        );

        await screen.findByText('Protected Content');

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
        expect(screen.queryByText('🏥 Welcome to MatchingDonors')).not.toBeInTheDocument();
    });

    it('should show unauthorized when authenticated but wrong role', async () => {
        const storedAuth = {
            token: 'test-token',
            user: {
                id: 1,
                email: 'test@example.com',
                role: 'donor',
                firstName: 'Jane',
                lastName: 'Smith',
            },
        };

        renderWithAuth(
            <AuthGate requiredRoles={['patient']}>{mockChildren}</AuthGate>,
            storedAuth
        );

        await screen.findByText('⚠️ Unauthorized Access');

        expect(screen.getByText('⚠️ Unauthorized Access')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should accept both patient and donor roles by default', async () => {
        const patientAuth = {
            token: 'test-token',
            user: {
                id: 1,
                email: 'patient@example.com',
                role: 'patient',
                firstName: 'John',
                lastName: 'Doe',
            },
        };

        const { unmount } = renderWithAuth(<AuthGate>{mockChildren}</AuthGate>, patientAuth);

        await screen.findByText('Protected Content');
        expect(screen.getByText('Protected Content')).toBeInTheDocument();

        unmount();
        localStorage.clear();

        const donorAuth = {
            token: 'test-token-2',
            user: {
                id: 2,
                email: 'donor@example.com',
                role: 'donor',
                firstName: 'Jane',
                lastName: 'Smith',
            },
        };

        renderWithAuth(<AuthGate>{mockChildren}</AuthGate>, donorAuth);

        await screen.findByText('Protected Content');
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
});
