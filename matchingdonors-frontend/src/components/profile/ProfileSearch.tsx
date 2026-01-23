import React, { useState } from 'react';
import { MatchRequest } from '../../types/profile.types';
import './ProfileSearch.css';

interface ProfileSearchProps {
    onSearch: (request: MatchRequest) => void;
    isSearching: boolean;
}

export const ProfileSearch: React.FC<ProfileSearchProps> = ({ onSearch, isSearching }) => {
    const [searchText, setSearchText] = useState('');
    const [topN, setTopN] = useState(10);
    const [minSimilarity, setMinSimilarity] = useState(0.5);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!searchText.trim()) {
            alert('Please enter search criteria');
            return;
        }

        const request: MatchRequest = {
            profileText: searchText.trim(),
            topN,
            minSimilarity,
        };

        onSearch(request);
    };

    return (
        <div className="profile-search">
            <h2 className="search-title">🔍 Find Matching Profiles</h2>
            <p className="search-subtitle">
                Use AI-powered matching to find the best patient/donor matches based on medical criteria
            </p>

            <form onSubmit={handleSubmit} className="search-form">
                <div className="form-group">
                    <label htmlFor="searchText" className="form-label">
                        Search Criteria
                    </label>
                    <textarea
                        id="searchText"
                        className="search-textarea"
                        placeholder="Example: Looking for kidney donor, blood type O+, age 25-40, non-smoker, healthy lifestyle..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        rows={4}
                        disabled={isSearching}
                    />
                    <span className="help-text">
                        Describe medical requirements, preferences, or profile characteristics
                    </span>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="topN" className="form-label">
                            Number of Results
                        </label>
                        <input
                            type="number"
                            id="topN"
                            className="form-input"
                            min="1"
                            max="50"
                            value={topN}
                            onChange={(e) => setTopN(parseInt(e.target.value))}
                            disabled={isSearching}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="minSimilarity" className="form-label">
                            Minimum Match Score (%)
                        </label>
                        <input
                            type="number"
                            id="minSimilarity"
                            className="form-input"
                            min="0"
                            max="100"
                            step="5"
                            value={minSimilarity * 100}
                            onChange={(e) => setMinSimilarity(parseInt(e.target.value) / 100)}
                            disabled={isSearching}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="search-btn"
                    disabled={isSearching || !searchText.trim()}
                >
                    {isSearching ? (
                        <>
                            <span className="spinner-small"></span>
                            Searching with AI...
                        </>
                    ) : (
                        <>
                            🤖 Search with Gemini AI
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};
