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


    // Load all profiles on mount
    useEffect(() => {
        loadProfiles();
    }, []);

    // Reload profiles when data mode changes
    useEffect(() => {
        console.log('🔄 useRealData changed to:', useRealData);
        loadProfiles();
    }, [useRealData]);


    const loadProfiles = async () => {
        console.log('📋 loadProfiles called with useRealData:', useRealData);
        setIsLoading(true);
        setError(null);
        try {
            const profiles = await profileService.getAllProfiles(useRealData);
            console.log('✅ Profiles loaded:', profiles.length);
            setAllProfiles(profiles);
        } catch (err: any) {
            console.error('❌ Error loading profiles:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (request: MatchRequest) => {
        setIsSearching(true);
        setError(null);
        setMatches([]);

        try {
            const results = await profileService.findMatches(request, useRealData);
            setMatches(results);
            setDataMode(useRealData ? 'real' : 'demo');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSearching(false);
        }
    };

    const handleViewDetails = (profile: Profile, matchScore?: number) => {
        setSelectedProfile(profile);
        setSelectedMatchScore(matchScore);
    };

    const filteredProfiles = profileService.filterProfilesByType(allProfiles, filterType);

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

            {/* Empty State for Real Data */}
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
            )}

            {/* Browse All Profiles Section */}
            <div className="browse-section">
                <div className="browse-header">
                    <h2 className="browse-title">📋 Browse All Profiles</h2>
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
                </div>

                {filteredProfiles.length === 0 ? (
                    <div className="no-profiles">
                        <p>No {filterType === 'all' ? '' : filterType} profiles available yet.</p>
                        <p className="hint">Profiles can be added via the backend API.</p>
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
        </div>
    );
};
