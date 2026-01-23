import React from 'react';
import { Profile } from '../../types/profile.types';
import './ProfileDetailModal.css';

interface ProfileDetailModalProps {
    profile: Profile | null;
    matchScore?: number;
    onClose: () => void;
}

export const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({
    profile,
    matchScore,
    onClose
}) => {
    if (!profile) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{profile.name}</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <div className="detail-row">
                        <span className="detail-label">Type:</span>
                        <span className={`type-badge-large ${profile.type === 'donor' ? 'donor' : 'patient'}`}>
                            {profile.type.toUpperCase()}
                        </span>
                    </div>

                    {matchScore !== undefined && (
                        <div className="detail-row">
                            <span className="detail-label">Match Score:</span>
                            <div className="match-bar-container">
                                <div
                                    className="match-bar"
                                    style={{ width: `${matchScore * 100}%` }}
                                />
                                <span className="match-percentage">{Math.round(matchScore * 100)}%</span>
                            </div>
                        </div>
                    )}

                    <div className="detail-section">
                        <h3 className="section-title">Description</h3>
                        <p className="section-text">{profile.description}</p>
                    </div>

                    <div className="detail-section">
                        <h3 className="section-title">Medical Information</h3>
                        <p className="section-text">{profile.medicalInfo}</p>
                    </div>

                    {profile.preferences && (
                        <div className="detail-section">
                            <h3 className="section-title">Preferences</h3>
                            <p className="section-text">{profile.preferences}</p>
                        </div>
                    )}

                    <div className="detail-section">
                        <h3 className="section-title">Profile ID</h3>
                        <p className="section-text id-text">{profile.id}</p>
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        className="contact-btn"
                        onClick={() => alert(`Contact functionality coming soon!\n\nIn production, this would:\n- Open email form\n- Send notification to ${profile.name}\n- Create message thread`)}
                    >
                        Contact This {profile.type}
                    </button>
                    <button className="close-modal-btn" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};
