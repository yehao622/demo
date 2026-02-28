import React from 'react';
import { Profile } from '../../types/profile.types';
import './ProfileCard.css';

interface ScoreBreakdown {
    baseScore: number;
    aiSimilarity?: number;
    bloodTypeScore: number;
    locationScore: number;
    ageScore: number;
    organScore?: number;
}

interface ProfileCardProps {
    profile: Profile;
    matchScore?: number;
    rank?: number;
    reason?: string;
    scoreBreakdown?: ScoreBreakdown;
    onViewDetails: (profile: Profile) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
    profile,
    matchScore,
    rank,
    reason,
    scoreBreakdown,
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

            {scoreBreakdown && (
                <div className="score-breakdown">
                    {scoreBreakdown.organScore !== undefined && (
                        <div className="breakdown-item" title="Organ Match (Base)">
                            <span className="breakdown-label"> Organ</span>
                            <span className="breakdown-value">{scoreBreakdown.organScore}</span>
                        </div>
                    )}
                    <div className="breakdown-item" title="Blood Compatibility">
                        <span className="breakdown-label"> Blood</span>
                        <span className="breakdown-value">+{scoreBreakdown.bloodTypeScore}</span>
                    </div>
                    <div className="breakdown-item" title="Location Proximity">
                        <span className="breakdown-label"> Loc</span>
                        <span className="breakdown-value">+{scoreBreakdown.locationScore}</span>
                    </div>
                    <div className="breakdown-item" title="Age Compatibility">
                        <span className="breakdown-label"> Age</span>
                        <span className="breakdown-value">+{scoreBreakdown.ageScore}</span>
                    </div>
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
                        {(() => {
                            // Safely check for either naming convention and provide a fallback string
                            const medInfo = profile.medicalInfo || (profile as any).medical_info || 'No medical information provided.';
                            return medInfo.length > 150 ? `${medInfo.substring(0, 150)}...` : medInfo;
                        })()}
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
