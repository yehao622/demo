import React from 'react';
import './ProfileCompletionModal.css';

interface ProfileCompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    userRole: 'patient' | 'donor';
}

export const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
    isOpen,
    onClose,
    onComplete,
    userRole,
}) => {
    if (!isOpen) return null;

    const handleComplete = () => {
        onComplete();
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content profile-completion-modal">
                <div className="modal-header">
                    <h2>👋 Welcome! Complete Your Profile</h2>
                </div>

                <div className="modal-body">
                    <p>
                        To get started as a <strong>{userRole}</strong>, please complete your medical profile.
                        This helps us match you with compatible {userRole === 'patient' ? 'donors' : 'patients'}.
                    </p>

                    <div className="required-info">
                        <h3>Required Information:</h3>
                        <ul>
                            <li>✓ Organ Type</li>
                            <li>✓ Age</li>
                            <li>✓ Blood Type</li>
                        </ul>
                        <p className="info-note">
                            You can type or use voice input to describe your situation, and our AI will
                            help you create a complete profile.
                        </p>
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        className="btn-primary"
                        onClick={handleComplete}
                    >
                        Complete Profile Now
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={onClose}
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
};
