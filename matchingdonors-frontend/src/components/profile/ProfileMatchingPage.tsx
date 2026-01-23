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

    // Load all profiles on mount
    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const profiles = await profileService.getAllProfiles();
            setAllProfiles(profiles);
        } catch (err: any) {
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
            const results = await profileService.findMatches(request);
            setMatches(results);
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

            {/* Search Section */}
            <ProfileSearch onSearch={handleSearch} isSearching={isSearching} />

            {/* Error Display */}
            {error && <ErrorMessage message={error} onRetry={loadProfiles} />}

            {/* Match Results */}
            {matches.length > 0 && (
                <MatchResults
                    matches={matches}
                    onViewDetails={(profile) => {
                        const match = matches.find(m => m.profileId === profile.id);
                        handleViewDetails(profile, match?.similarity);
                    }}
                />
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
