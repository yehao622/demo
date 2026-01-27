import React, { useState } from 'react';
import { MatchRequest } from '../../types/profile.types';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import './ProfileSearch.css';
import '../../styles/shared-voice-input.css';

interface ProfileSearchProps {
    onSearch: (request: MatchRequest) => void;
    isSearching: boolean;
}

export const ProfileSearch: React.FC<ProfileSearchProps> = ({ onSearch, isSearching }) => {
    const [searchText, setSearchText] = useState('');
    const [topN, setTopN] = useState(10);
    const [minSimilarity, setMinSimilarity] = useState(0.5);
    const { isRecording, isTranscribing, error: voiceError, handleVoiceInput } = useVoiceInput(
        (transcript) => setSearchText(prev => prev ? prev + ' ' + transcript : transcript)
    );

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

    // Example search queries
    const exampleSearches = [
        "Looking for kidney donor, blood type O+, age 25-40, non-smoker, healthy lifestyle",
        "I can donate my liver, blood type A+, age 35, excellent health, willing to travel",
        "Need heart donor urgently, blood type B+, compatible with ages 30-50"
    ];

    const handleExampleClick = (example: string) => {
        setSearchText(example);
    };

    return (
        <div className="profile-search">
            <h2 className="search-title">🔍 Find Matching Profiles</h2>
            <p className="search-subtitle">
                Use AI-powered matching to find the best patient/donor matches based on medical criteria
            </p>

            <form onSubmit={handleSubmit} className="search-form">
                <div className="form-group">
                    <div className="form-label-with-actions">
                        <label htmlFor="searchText" className="form-label">
                            Search Criteria
                        </label>
                        <button
                            type="button"
                            className={`audio-button ${isRecording ? 'recording' : ''}`}
                            onClick={handleVoiceInput}
                            disabled={isSearching || isTranscribing}
                            title={isRecording ? 'Click to stop recording' : 'Click to start recording'}
                        >
                            {isRecording ? (
                                <>
                                    <span className="recording-pulse"></span>
                                    🎤 Recording...
                                </>
                            ) : isTranscribing ? (
                                '🔄 Transcribing...'
                            ) : (
                                '🎤 Voice Input'
                            )}
                        </button>
                    </div>
                    <textarea
                        id="searchText"
                        className="search-textarea"
                        placeholder="Example: Looking for kidney donor, blood type O+, age 25-40, non-smoker, healthy lifestyle..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        rows={4}
                        disabled={isSearching || isTranscribing}
                    />
                    <span className="help-text">
                        Describe medical requirements, preferences, or profile characteristics
                    </span>

                    {/* Example searches */}
                    <div className="example-searches">
                        <span className="example-label">Quick examples:</span>
                        {exampleSearches.map((example, idx) => (
                            <button
                                key={idx}
                                type="button"
                                className="example-chip"
                                onClick={() => handleExampleClick(example)}
                                disabled={isSearching || isTranscribing}
                            >
                                {example.substring(0, 50)}...
                            </button>
                        ))}
                    </div>
                </div>

                {isRecording && (
                    <div className="success-message">
                        ✅ Recording... Speak clearly. Click the button again when done.
                    </div>
                )}

                {isTranscribing && (
                    <div className="info-message">
                        🔄 Transcribing your audio with AI... Please wait.
                    </div>
                )}

                {voiceError && (
                    <div className="error-message">
                        ❌ {voiceError}
                    </div>
                )}

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
                    disabled={isSearching || !searchText.trim() || isTranscribing}
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
