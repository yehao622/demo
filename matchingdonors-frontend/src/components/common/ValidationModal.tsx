import React from 'react';
import './ValidationModal.css';

interface ValidationModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'role' | 'tab';
    message: string;
    suggestedAction?: string;
    onActionClick?: () => void;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
    isOpen,
    onClose,
    type,
    message,
    suggestedAction,
    onActionClick,
}) => {
    if (!isOpen) return null;

    const icon = type === 'role' ? '⚠️' : '🔄';
    const title = type === 'role' ? 'Role Mismatch Detected' : 'Wrong Tab';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content validation-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-icon">{icon}</span>
                    <h3>{title}</h3>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    {suggestedAction && onActionClick && (
                        <button className="btn btn-primary" onClick={onActionClick}>
                            {suggestedAction}
                        </button>
                    )}
                    <button className="btn btn-secondary" onClick={onClose}>
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
};
