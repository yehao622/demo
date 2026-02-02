import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth.types';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import '../../styles/AuthModals.css';

interface LoginModalProps {
    role: UserRole;
    onClose: () => void;
    onSwitchToRegister: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ role, onClose, onSwitchToRegister }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Pass role to login API
            await login(email, password, role);
            onClose();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Login failed';
            setError(errorMessage);
            setIsLoading(false);

            // If role mismatch error, show for 3 seconds then close
            if (errorMessage.includes('registered as')) {
                setTimeout(() => {
                    onClose();
                }, 3000);
            }
        }
    };

    if (showForgotPassword) {
        return (
            <ForgotPasswordModal
                role={role}
                onClose={() => setShowForgotPassword(false)}
                onBack={() => setShowForgotPassword(false)}
            />
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>

                <div className="modal-header">
                    <h2>Welcome Back, {role === 'patient' ? 'Patient' : 'Donor'}! 👋</h2>
                    <p>Sign in to continue</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your.email@example.com"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            disabled={isLoading}
                            minLength={8}
                        />
                    </div>

                    <button
                        type="button"
                        className="forgot-password-link"
                        onClick={() => setShowForgotPassword(true)}
                    >
                        Forgot password?
                    </button>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="modal-footer">
                    <p>
                        New user?{' '}
                        <button
                            type="button"
                            className="link-button"
                            onClick={onSwitchToRegister}
                        >
                            Register here
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};