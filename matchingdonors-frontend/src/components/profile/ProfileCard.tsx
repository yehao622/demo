import React from 'react';
import { Profile } from '../../types/profile.types';
import './ProfileCard.css';

interface ScoreBreakdown {
    baseScore?: number;
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
    // Safely map all possible database snake_case variables
    const bloodType = profile.bloodType || (profile as any).blood_type || 'Not specified';
    const organType = profile.organType || (profile as any).organ_type || 'Not specified';
    // const medicalInfo = profile.medicalInfo || (profile as any).medical_info || 'No medical information provided.';

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
                        {profile.type === 'patient' ? '🏥 Patient' : '❤️ Donor'}
                    </span>
                </div>
                {matchScore !== undefined && (
                    <div className={`match-score ${getMatchScoreClass(matchScore)}`}>
                        {Math.round(matchScore * 100)}% Match
                    </div>
                )}
            </div>

            <div className="profile-quick-stats">
                <div>Blood: <strong>{bloodType}</strong></div>
                <div>Organ: <strong>{organType}</strong></div>
                <div>Loc: <strong>{profile.city}, {profile.state}</strong></div>
                <div>Age: <strong>{profile.age || 'N/A'}</strong></div>
            </div>

            {reason && (
                <div className="match-reason-card">
                    <div className="reason-icon">✓</div>
                    <p className="reason-text">{reason}</p>
                </div>
            )}

            {scoreBreakdown && (
                <div className="score-breakdown">

                    {scoreBreakdown.organScore !== undefined && (
                        <div className="breakdown-item">
                            <span className="breakdown-label">Organ</span>
                            <span className="breakdown-value">+{scoreBreakdown.organScore}</span>
                        </div>
                    )}

                    <div className="breakdown-item">
                        <span className="breakdown-label">Blood Type</span>
                        <span className="breakdown-value">+{scoreBreakdown.bloodTypeScore}</span>
                    </div>

                    <div className="breakdown-item">
                        <span className="breakdown-label">Location</span>
                        <span className="breakdown-value">+{scoreBreakdown.locationScore}</span>
                    </div>

                    <div className="breakdown-item">
                        <span className="breakdown-label">Age</span>
                        <span className="breakdown-value">+{scoreBreakdown.ageScore}</span>
                    </div>

                    <div className="breakdown-item">
                        <span className="breakdown-label">AI Similarity</span>
                        <span className="breakdown-value">+{Math.round((scoreBreakdown.aiSimilarity || scoreBreakdown.baseScore || 0))}</span>
                    </div>
                </div>
            )}

            {/* <div className="profile-details">
                <div className="detail-section">
                    <strong>Medical Info:</strong>
                    <p>
                        {medicalInfo.length > 150 ? `${medicalInfo.substring(0, 150)}...` : medicalInfo}
                    </p>
                </div>
            </div> */}

            <button
                className="view-details-btn"
                onClick={() => onViewDetails(profile)}
            >
                View Full Profile
            </button>
        </div>
    );
};