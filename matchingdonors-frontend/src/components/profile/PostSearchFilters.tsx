import React from 'react';
import './PostSearchFilters.css';

type MatchTier = 'all' | 'excellent' | 'good';

interface PostSearchFiltersProps {
    totalMatches: number;
    currentFilter: MatchTier;
    onFilterChange: (filter: MatchTier) => void;
    matchCounts: {
        excellent: number;
        good: number;
    };
}

export const PostSearchFilters: React.FC<PostSearchFiltersProps> = ({
    totalMatches,
    currentFilter,
    onFilterChange,
    matchCounts
}) => {
    return (
        <div className="post-search-filters">
            <p className="filter-label">Refine your results:</p>
            <div className="filter-buttons">
                <button
                    className={`filter-btn ${currentFilter === 'all' ? 'active' : ''}`}
                    onClick={() => onFilterChange('all')}
                >
                    All Matches ({totalMatches})
                </button>
                <button
                    className={`filter-btn excellent ${currentFilter === 'excellent' ? 'active' : ''}`}
                    onClick={() => onFilterChange('excellent')}
                >
                    Excellent (≥80%) • {matchCounts.excellent}
                </button>
                <button
                    className={`filter-btn good ${currentFilter === 'good' ? 'active' : ''}`}
                    onClick={() => onFilterChange('good')}
                >
                    Good (60-79%) • {matchCounts.good}
                </button>
            </div>
        </div>
    );
};
