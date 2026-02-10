import React, { useState, useEffect } from 'react';
import { Profile, MatchResult, MatchRequest } from '../../types/profile.types';
import { profileService } from '../../services/profileService';
import { ProfileSearch } from './ProfileSearch';
import { MatchResults } from './MatchResults';
import { ProfileDetailModal } from './ProfileDetailModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import './ProfileMatchingPage.css';

export const ProfileMatchingPage: React.FC = () => {
    const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
    const [matches, setMatches] = useState<MatchResult[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const [selectedMatchScore, setSelectedMatchScore] = useState<number | undefined>();
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<'all' | 'patient' | 'donor'>('all');
    const [useRealData, setUseRealData] = useState(false);
    const [dataMode, setDataMode] = useState<'demo' | 'real'>('demo');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Get current user for filtering
    const authUser = localStorage.getItem('auth_user');
    const currentUser = authUser ? JSON.parse(authUser) : null;

    // Load all profiles on mount
    useEffect(() => {
        loadProfiles();
    }, []);

    // Reload profiles when data mode changes
    useEffect(() => {
        console.log('🔄 useRealData changed to:', useRealData);
        loadProfiles();
        setDataMode(useRealData ? 'real' : 'demo');

        // Reset filter type based on mode
        if (useRealData && currentUser) {
            // In Real Mode, automatically set filter to opposite of user role
            const oppositeRole = currentUser.role === 'patient' ? 'donor' : 'patient';
            setFilterType(oppositeRole);
        } else {
            setFilterType('all');
        }
    }, [useRealData]);


    const loadProfiles = async () => {
        console.log('📋 loadProfiles called with useRealData:', useRealData);
        setIsLoading(true);
        setError(null);
        try {
            const profiles = await profileService.getAllProfiles(useRealData);
            // console.log('✅ Profiles loaded:', profiles.length);
            setAllProfiles(profiles);
        } catch (err: any) {
            console.error('❌ Error loading profiles:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (request: MatchRequest) => {
        console.log('🔍 Search request received:', request);

        // Validate that we have search text
        if (!request.profileText || !request.profileText.trim()) {
            alert('Please enter search criteria');
            return;
        }

        setIsSearching(true);
        setSearchResults([]);

        try {
            let searcherType = 'patient'; // default

            if (currentUser) {
                searcherType = currentUser.role;
                console.log('👤 Searching as:', searcherType, '(user ID:', currentUser.id, ')');
            }

            // Build the request with searcherType
            const searchRequest = {
                ...request,
                searcherType
            };

            // Call the API
            const response = await profileService.findMatches(
                searchRequest
                // useRealData
            );

            if (response.success) {
                const matches = response.matches || [];
                setSearchResults(matches);

                if (matches.length === 0) {
                    alert('No matches found. Try adjusting your search criteria or minimum match score.');
                }
            } else {
                console.error('❌ Search failed:', response);
                alert('Search failed. Please try again.');
            }
        } catch (error) {
            console.error('❌ Error during search:', error);
            alert('Search failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsSearching(false);
        }
    };

    const handleViewDetails = (profile: Profile, matchScore?: number) => {
        setSelectedProfile(profile);
        setSelectedMatchScore(matchScore);
    };

    // Strict filtering logic for "Browse All Profiles"
    const getFilteredProfiles = () => {
        let filtered = allProfiles;

        // 1. First apply strict "Real Mode" Role Filtering
        if (useRealData && currentUser) {
            const targetRole = currentUser.role === 'patient' ? 'donor' : 'patient';
            filtered = filtered.filter(p => p.type === targetRole);
        }

        // 2. Then apply the UI tab filter (if not in Real Mode or if it matches target)
        if (!useRealData) {
            if (filterType !== 'all') {
                filtered = filtered.filter(p => p.type === filterType);
            }
        }

        return filtered;
    };

    const filteredProfiles = getFilteredProfiles();

    if (isLoading) {
        return <LoadingSpinner message="Loading profiles..." />;
    }

    return (
        <div className="profile-matching-page">
            <div className="page-header">
                <h1 className="page-title">👥 Profile Matching Agent</h1>
                <p className="page-description">
                    AI-powered patient and donor matching using Gemini embeddings for intelligent profile recommendations
                </p>
            </div>

            {/* Data Mode Toggle */}
            <div className="data-mode-section">
                <div className="toggle-container">
                    <label className="toggle-label">
                        <input
                            type="checkbox"
                            className="toggle-checkbox"
                            checked={useRealData}
                            onChange={(e) => setUseRealData(e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-text">
                            {useRealData ? '🔴 Real Matches Mode' : '🟢 Demo Mode'}
                        </span>
                    </label>
                    <p className="toggle-description">
                        {useRealData
                            ? 'Searching registered users from database'
                            : 'Using demo/seed data for testing'}
                    </p>
                </div>
            </div>


            {/* Search Section */}
            <ProfileSearch onSearch={handleSearch} isSearching={isSearching} />

            {/* Error Display */}
            {error && <ErrorMessage message={error} onRetry={loadProfiles} />}

            {/* Match Results */}
            {matches.length > 0 && (
                <>
                    <div className="results-header">
                        <h2>✨ Match Results</h2>
                        <span className={`mode-badge ${dataMode}`}>
                            {dataMode === 'real' ? '🔴 Real Users' : '🟢 Demo Data'}
                        </span>
                    </div>
                    <MatchResults
                        matches={matches}
                        onViewDetails={(profile) => {
                            const match = matches.find(m => m.profileId === profile.id);
                            handleViewDetails(profile, match?.similarity);
                        }}
                    />
                </>
            )}

            {/* Empty State for Real Data
            {matches.length === 0 && isSearching === false && dataMode === 'real' && (
                <div className="empty-state-real">
                    <div className="empty-icon">🔍</div>
                    <h3>No Real Matches Found</h3>
                    <p>No registered users match your search criteria yet.</p>
                    <div className="empty-actions">
                        <button
                            className="btn-demo"
                            onClick={() => setUseRealData(false)}
                        >
                            Try Demo Mode
                        </button>
                    </div>
                </div>
            )} */}

            {/* Browse All Profiles Section */}
            <div className="browse-section">
                <div className="browse-header">
                    <h2 className="browse-title">
                        {useRealData
                            ? `📋 Available ${currentUser?.role === 'patient' ? 'Donors' : 'Patients'}`
                            : '📋 Browse All Profiles'
                        }
                    </h2>

                    {/* Hide filter tabs in Real Mode to enforce strict matching logic */}
                    {!useRealData && (
                        <div className="filter-tabs">
                            <button
                                className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
                                onClick={() => setFilterType('all')}
                            >
                                All ({allProfiles.length})
                            </button>
                            <button
                                className={`filter-tab ${filterType === 'patient' ? 'active' : ''}`}
                                onClick={() => setFilterType('patient')}
                            >
                                Patients ({allProfiles.filter(p => p.type === 'patient').length})
                            </button>
                            <button
                                className={`filter-tab ${filterType === 'donor' ? 'active' : ''}`}
                                onClick={() => setFilterType('donor')}
                            >
                                Donors ({allProfiles.filter(p => p.type === 'donor').length})
                            </button>
                        </div>
                    )}
                </div>

                {filteredProfiles.length === 0 ? (
                    <div className="no-profiles">
                        <p>No profiles available matching your criteria.</p>
                        {useRealData && <p className="hint">Try switching to Demo Mode to see example profiles.</p>}
                    </div>
                ) : (
                    <div className="profiles-grid">
                        {filteredProfiles.map((profile) => (
                            <div key={profile.id} className="profile-card-wrapper">
                                <div className="profile-card-simple">
                                    <div className="profile-header-simple">
                                        <h3>{profile.name}</h3>
                                        <span className={`badge-simple ${profile.type}`}>
                                            {profile.type}
                                        </span>
                                    </div>
                                    <p className="description-simple">{profile.description}</p>
                                    <button
                                        className="view-btn-simple"
                                        onClick={() => handleViewDetails(profile)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Profile Detail Modal */}
            <ProfileDetailModal
                profile={selectedProfile}
                matchScore={selectedMatchScore}
                onClose={() => {
                    setSelectedProfile(null);
                    setSelectedMatchScore(undefined);
                }}
            />

            {/* Search Results Section */}
            {searchResults.length > 0 && (
                <div className="browse-section">
                    <div className="browse-header">
                        <h2>✨ Search Results ({searchResults.length})</h2>
                        {useRealData && <span className="mode-badge real">Real Users</span>}
                    </div>

                    <div className="profiles-grid">
                        {searchResults.map((match: any) => {
                            const profile = match.profile;
                            const score = Math.round(match.similarity * 100);

                            return (
                                <div key={profile.id} className="profile-card-wrapper">
                                    <div className="profile-card-simple">
                                        <div className="match-score-badge">{score}%</div>
                                        <div className="profile-header-simple">
                                            <h3>{profile.name}</h3>
                                            <span className={`badge-simple ${profile.type}`}>
                                                {profile.type}
                                            </span>
                                        </div>
                                        <div className="profile-details-simple">
                                            <p>🩸 {profile.bloodType || 'Not specified'}</p>
                                            <p>🎂 {profile.age || 'N/A'} years</p>
                                            <p>📍 {profile.city}, {profile.state}</p>
                                            <p>💉 {profile.organType || 'Not specified'}</p>
                                        </div>
                                        <p className="description-simple">
                                            {profile.description?.substring(0, 100)}...
                                        </p>
                                        {match.reason && (
                                            <p className="match-reason">
                                                ✓ {match.reason}
                                            </p>
                                        )}
                                        <button
                                            className="view-btn-simple"
                                            onClick={() => handleViewDetails(profile, match.similarity)}
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
