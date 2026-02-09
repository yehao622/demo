import React from 'react';
import { Profile } from '../../types/profile.types';
import { checkProfileCompleteness } from '../../utils/profileCompleteness';
import './ProfileCompletenessBadge.css';

interface ProfileCompletenessBadgeProps {
    profile: Profile;
    showDetails?: boolean;
}

export const ProfileCompletenessBadge: React.FC<ProfileCompletenessBadgeProps> = ({
    profile,
    showDetails = false
}) => {
    const completeness = checkProfileCompleteness(profile);

    return (
        <div className="completeness-container">
            <div
                className={`completeness-badge ${completeness.isComplete ? 'complete' : 'incomplete'}`}
            >
                <span className="completeness-icon">
                    {completeness.isComplete ? '✓' : '⚠'}
                </span>
                <span className="completeness-text">
                    {completeness.isComplete ? 'Profile Complete' : 'Profile Incomplete'}
                </span>
            </div>

            {showDetails && !completeness.isComplete && (
                <div className="completeness-details">
                    <p className="completeness-message">
                        <strong>Missing Information:</strong>
                    </p>
                    <ul className="missing-fields-list">
                        {completeness.missingFields.map((field, index) => (
                            <li key={index}>{field}</li>
                        ))}
                    </ul>
                    <p className="completeness-tip">
                        💡 Complete your profile to get better matches and higher visibility
                    </p>
                </div>
            )}
        </div>
    );
};
