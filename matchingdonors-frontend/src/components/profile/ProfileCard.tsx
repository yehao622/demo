import React from 'react';
import { Profile, MatchResult } from '../../types/profile.types';
import './ProfileCard.css';

interface ProfileCardProps {
    profile: Profile;
    matchScore?: number;
    rank?: number;
    onViewDetails: (profile: Profile) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
    profile,
    matchScore,
    rank,
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

    return (
        <div className="profile-card">
            <div className="profile-card-header">
                <div className="profile-info">
                    <h3 className="profile-name">{profile.name}</h3>
                    <span className={`type-badge ${getTypeColor(profile.type)}`}>
                        {profile.type.toUpperCase()}
                    </span>
                </div>
                {matchScore !== undefined && (
                    <div className={`match-score ${getMatchScoreClass(matchScore)}`}>
                        <div className="score-value">{Math.round(matchScore * 100)}%</div>
                        <div className="score-label">Match</div>
                        {rank !== undefined && <div className="rank-badge">#{rank}</div>}
                    </div>
                )}
            </div>

            <div className="profile-card-body">
                <div className="profile-section">
                    <label className="section-label">Description:</label>
                    <p className="section-content">{profile.description}</p>
                </div>

                <div className="profile-section">
                    <label className="section-label">Medical Info:</label>
                    <p className="section-content medical-info">
                        {profile.medicalInfo.length > 150
                            ? `${profile.medicalInfo.substring(0, 150)}...`
                            : profile.medicalInfo}
                    </p>
                </div>

                {profile.preferences && (
                    <div className="profile-section">
                        <label className="section-label">Preferences:</label>
                        <p className="section-content">{profile.preferences}</p>
                    </div>
                )}
            </div>

            <div className="profile-card-footer">
                <button
                    className="view-details-btn"
                    onClick={() => onViewDetails(profile)}
                >
                    View Full Profile
                </button>
            </div>
        </div>
    );
};
