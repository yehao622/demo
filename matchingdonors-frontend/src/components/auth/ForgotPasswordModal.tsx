import React, { useState, useEffect } from 'react';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../types/auth.types';
import '../../styles/AuthModals.css';

interface ForgotPasswordModalProps {
    role: UserRole;
    onClose: () => void;
    onBack: () => void;
}

type Step = 'email' | 'code' | 'password' | 'success';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ role, onClose, onBack }) => {
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [canResend, setCanResend] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);

    // Countdown timer for resend button
    useEffect(() => {
        if (step === 'code' && resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        } else if (resendTimer === 0) {
            setCanResend(true);
        }
    }, [step, resendTimer]);

    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await AuthService.forgotPassword(email, role);
            setStep('code');
            setResendTimer(60);
            setCanResend(false);
            // In demo mode, show the code
            if (response.code) {
                console.log('Reset code (demo mode):', response.code);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send reset code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await AuthService.verifyResetCode(email, code, role);
            if (response.valid) {
                setStep('password');
            } else {
                setError('Invalid or expired code');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to verify code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setIsLoading(true);

        try {
            await AuthService.resetPassword(email, code, newPassword, role);
            setStep('success');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        setError('');
        setIsLoading(true);

        try {
            await AuthService.forgotPassword(email, role);
            setResendTimer(60);
            setCanResend(false);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to resend code');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>

                {step === 'email' && (
                    <>
                        <div className="modal-header">
                            <h2>Reset Your Password 🔑</h2>
                            <p>Enter your email to receive a reset code for <strong>{role === 'patient' ? 'Patient 🩺' : 'Donor ❤️'}</strong></p>

                        </div>

                        <form onSubmit={handleRequestCode} className="auth-form">
                            {error && <div className="error-message">{error}</div>}

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

                            <button type="submit" className="btn-primary" disabled={isLoading}>
                                {isLoading ? 'Sending...' : 'Send Reset Code'}
                            </button>
                        </form>

                        <div className="modal-footer">
                            <button type="button" className="link-button" onClick={onBack}>
                                ← Back to login
                            </button>
                        </div>
                    </>
                )}

                {step === 'code' && (
                    <>
                        <div className="modal-header">
                            <h2>Enter Verification Code 📧</h2>
                            <p>We sent a 6-digit code to {email}</p>
                        </div>

                        <form onSubmit={handleVerifyCode} className="auth-form">
                            {error && <div className="error-message">{error}</div>}

                            <div className="form-group">
                                <label htmlFor="code">6-Digit Code</label>
                                <input
                                    id="code"
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="000000"
                                    required
                                    disabled={isLoading}
                                    maxLength={6}
                                    pattern="[0-9]{6}"
                                />
                            </div>

                            <button type="submit" className="btn-primary" disabled={isLoading}>
                                {isLoading ? 'Verifying...' : 'Verify Code'}
                            </button>

                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleResendCode}
                                disabled={!canResend || isLoading}
                            >
                                {canResend ? 'Resend Code' : `Resend in ${resendTimer}s`}
                            </button>
                        </form>
                    </>
                )}

                {step === 'password' && (
                    <>
                        <div className="modal-header">
                            <h2>Create New Password 🔒</h2>
                            <p>Enter your new password</p>
                        </div>

                        <form onSubmit={handleResetPassword} className="auth-form">
                            {error && <div className="error-message">{error}</div>}

                            <div className="form-group">
                                <label htmlFor="newPassword">New Password</label>
                                <input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Min. 8 characters"
                                    required
                                    disabled={isLoading}
                                    minLength={8}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter password"
                                    required
                                    disabled={isLoading}
                                    minLength={8}
                                />
                            </div>

                            <button type="submit" className="btn-primary" disabled={isLoading}>
                                {isLoading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    </>
                )}

                {step === 'success' && (
                    <>
                        <div className="modal-header success">
                            <div className="success-icon">✅</div>
                            <h2>Password Reset Successful!</h2>
                            <p>You can now sign in with your new password</p>
                        </div>

                        <button type="button" className="btn-primary" onClick={onBack}>
                            Back to Login
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
