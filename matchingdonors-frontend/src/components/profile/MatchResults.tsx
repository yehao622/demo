import React from 'react';
import { MatchResult, Profile } from '../../types/profile.types';
import { ProfileCard } from './ProfileCard';
import './MatchResults.css';

interface MatchResultsProps {
    matches: MatchResult[];
    onViewDetails: (profile: Profile) => void;
}

export const MatchResults: React.FC<MatchResultsProps> = ({ matches, onViewDetails }) => {
    if (matches.length === 0) {
        return (
            <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3>No Matches Found</h3>
                <p>Try adjusting your search criteria or lowering the minimum match score</p>
            </div>
        );
    }

    const topMatch = matches[0];
    const remainingMatches = matches.slice(1);

    return (
        <div className="match-results">
            <div className="results-header">
                <h2 className="results-title">
                    🎯 Found {matches.length} {matches.length === 1 ? 'Match' : 'Matches'}
                </h2>
                <p className="results-subtitle">
                    Powered by Gemini AI Embeddings
                </p>
            </div>

            {/* Top Match Highlight */}
            <div className="top-match-section">
                <div className="top-match-label">
                    <span className="trophy-icon">🏆</span>
                    <span>Best Match</span>
                </div>
                <ProfileCard
                    profile={topMatch.profile}
                    matchScore={topMatch.similarity}
                    rank={topMatch.rank}
                    onViewDetails={onViewDetails}
                />
            </div>

            {/* Remaining Matches Grid */}
            {remainingMatches.length > 0 && (
                <div className="other-matches-section">
                    <h3 className="section-heading">Other Strong Matches</h3>
                    <div className="matches-grid">
                        {remainingMatches.map((match) => (
                            <ProfileCard
                                key={match.profileId}
                                profile={match.profile}
                                matchScore={match.similarity}
                                rank={match.rank}
                                onViewDetails={onViewDetails}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
