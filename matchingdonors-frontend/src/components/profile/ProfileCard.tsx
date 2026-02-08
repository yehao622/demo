import React from 'react';
import { Profile } from '../../types/profile.types';
import './ProfileCard.css';

interface ProfileCardProps {
    profile: Profile;
    matchScore?: number;
    rank?: number;
    reason?: string;
    onViewDetails: (profile: Profile) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
    profile,
    matchScore,
    rank,
    reason,
    onViewDetails
}) => {
    const getTypeColor = (type: string) => {
        return type === 'donor' ? 'donor-badge' : 'patient-badge';
    };

    const getMatchScoreClass = (score?: number) => {
        if (!score) return '';
        if (score >= 0.8) return 'score-high';
        if (score >= 0.6) return 'score-medium';
        return 'score-low';
    };

    const getMatchLabel = (score?: number) => {
        if (!score) return '';
        if (score >= 0.8) return 'Excellent Match';
        if (score >= 0.6) return 'Good Match';
        return 'Potential Match';
    };

    return (
        <div className="profile-card">
            <div className="profile-card-header">
                <h3 className="profile-name">{profile.name}</h3>
                <span className={`profile-type-badge ${getTypeColor(profile.type)}`}>
                    {profile.type.toUpperCase()}
                </span>
            </div>

            {matchScore !== undefined && (
                <div className="match-score-container">
                    <div className={`match-score ${getMatchScoreClass(matchScore)}`}>
                        {Math.round(matchScore * 100)}%
                    </div>
                    <div className="match-label">{getMatchLabel(matchScore)}</div>
                    {rank !== undefined && <div className="match-rank">#{rank}</div>}
                </div>
            )}

            {reason && (
                <div className="match-reason">
                    <div className="reason-icon">✓</div>
                    <p className="reason-text">{reason}</p>
                </div>
            )}

            <div className="profile-details">
                <div className="detail-section">
                    <strong>Description:</strong>
                    <p>{profile.description}</p>
                </div>

                <div className="detail-section">
                    <strong>Medical Info:</strong>
                    <p>
                        {profile.medicalInfo.length > 150
                            ? `${profile.medicalInfo.substring(0, 150)}...`
                            : profile.medicalInfo}
                    </p>
                </div>

                {profile.preferences && (
                    <div className="detail-section">
                        <strong>Preferences:</strong>
                        <p>{profile.preferences}</p>
                    </div>
                )}
            </div>

            <button
                className="view-details-button"
                onClick={() => {
                    onViewDetails(profile)
                }}
            >
                View Full Profile
            </button>
        </div>
    );
};
