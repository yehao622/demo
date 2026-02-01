import React, { useState } from 'react';
import { UserRole } from '../../types/auth.types';
import { LoginModal } from './LoginModal';
import { RegisterModal } from './RegisterModal';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/AuthGate.css';

interface AuthGateProps {
    children: React.ReactNode;
    requiredRoles?: UserRole[];
}

export const AuthGate: React.FC<AuthGateProps> = ({ children, requiredRoles = ['patient', 'donor'] }) => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);

    // Show loading state
    if (isLoading) {
        return (
            <div className="auth-gate-loading">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    // Check if user is authenticated and has required role
    if (isAuthenticated && user) {
        if (requiredRoles.includes(user.role)) {
            return <>{children}</>;
        } else {
            return (
                <div className="auth-gate-unauthorized">
                    <h2>⚠️ Unauthorized Access</h2>
                    <p>You don't have permission to access this feature.</p>
                    <p>Required role: {requiredRoles.join(' or ')}</p>
                    <p>Your role: {user.role}</p>
                </div>
            );
        }
    }

    // Show role selection if no role selected
    return (
        <div className="auth-gate-container">
            <div className="auth-gate-content">
                <h1 className="auth-gate-title">🏥 Welcome to MatchingDonors</h1>
                <p className="auth-gate-subtitle">Choose your role to continue</p>

                <div className="role-selection">
                    <button
                        className="role-card patient-card"
                        onClick={() => {
                            setSelectedRole('patient');
                            setShowLogin(true);
                        }}
                    >
                        <div className="role-icon">🙏</div>
                        <h2>I'm a Patient</h2>
                        <p>Looking for a matching donor</p>
                    </button>

                    <button
                        className="role-card donor-card"
                        onClick={() => {
                            setSelectedRole('donor');
                            setShowLogin(true);
                        }}
                    >
                        <div className="role-icon">❤️</div>
                        <h2>I'm a Donor</h2>
                        <p>Ready to help save lives</p>
                    </button>
                </div>
            </div>

            {showLogin && selectedRole && (
                <LoginModal
                    role={selectedRole}
                    onClose={() => {
                        setShowLogin(false);
                        setSelectedRole(null);
                    }}
                    onSwitchToRegister={() => {
                        setShowLogin(false);
                        setShowRegister(true);
                    }}
                />
            )}

            {showRegister && selectedRole && (
                <RegisterModal
                    role={selectedRole}
                    onClose={() => {
                        setShowRegister(false);
                        setSelectedRole(null);
                    }}
                    onSwitchToLogin={() => {
                        setShowRegister(false);
                        setShowLogin(true);
                    }}
                />
            )}
        </div>
    );
    return null;
};