import React, { useState, useMemo } from 'react';
import { MatchResult, Profile } from '../../types/profile.types';
import { ProfileCard } from './ProfileCard';
import { PostSearchFilters } from './PostSearchFilters';
import './MatchResults.css';

type MatchTier = 'all' | 'excellent' | 'good';

interface MatchResultsProps {
    matches: MatchResult[];
    onViewDetails: (profile: Profile) => void;
}

export const MatchResults: React.FC<MatchResultsProps> = ({ matches, onViewDetails }) => {
    const [filterTier, setFilterTier] = useState<MatchTier>('all');

    // Calculate match counts by tier
    const matchCounts = useMemo(() => {
        return {
            excellent: matches.filter(m => m.similarity >= 0.8).length,
            good: matches.filter(m => m.similarity >= 0.6 && m.similarity < 0.8).length
        };
    }, [matches]);

    // Filter matches based on selected tier
    const filteredMatches = useMemo(() => {
        if (filterTier === 'excellent') {
            return matches.filter(m => m.similarity >= 0.8);
        } else if (filterTier === 'good') {
            return matches.filter(m => m.similarity >= 0.6 && m.similarity < 0.8);
        }
        return matches;
    }, [matches, filterTier]);

    if (matches.length === 0) {
        return (
            <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3>No Matches Found</h3>
                <p>Try adjusting your search criteria or lowering the minimum match score</p>
            </div>
        );
    }

    const topMatch = filteredMatches[0];
    const remainingMatches = filteredMatches.slice(1);

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

            {/* Post-search filters */}
            <PostSearchFilters
                totalMatches={matches.length}
                currentFilter={filterTier}
                onFilterChange={setFilterTier}
                matchCounts={matchCounts}
            />

            {filteredMatches.length === 0 ? (
                <div className="no-results">
                    <div className="no-results-icon">🔍</div>
                    <h3>No matches in this category</h3>
                    <p>Try selecting a different filter</p>
                </div>
            ) : (
                <>
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
                            reason={topMatch.reason}
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
                                        reason={match.reason}
                                        onViewDetails={onViewDetails}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
