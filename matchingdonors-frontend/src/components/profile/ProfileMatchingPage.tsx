import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Profile, MatchResult, MatchRequest } from '../../types/profile.types';
import { AuthService } from '../../services/auth.service';
import { profileService } from '../../services/profileService';
import { ProfileSearch } from './ProfileSearch';
import { ProfileDetailModal } from './ProfileDetailModal';
import { ValidationModal } from '../common/ValidationModal';
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

    const [validationModal, setValidationModal] = useState<{
        isOpen: boolean;
        message: string;
        suggestedAction?: string;
        onConfirm?: () => void;
    }>({ isOpen: false, message: '' });

    // State for selected filters
    const [activeFilters, setActiveFilters] = useState({
        bloodType: '',
        organType: '',
        ageRange: '',
        country: '',
        state: ''
    });

    // Get current user for filtering
    const { user: currentUser } = useAuth();
    const isSponsor = currentUser?.role === 'sponsor';

    // Load all profiles on mount
    useEffect(() => {
        loadProfiles();
    }, []);

    // Reload profiles when data mode changes
    useEffect(() => {
        console.log('🔄 useRealData changed to:', useRealData);
        loadProfiles();
        setDataMode(useRealData ? 'real' : 'demo');

        if (useRealData && currentUser && !isSponsor) {
            const oppositeRole = currentUser.role === 'patient' ? 'donor' : 'patient';
            setFilterType(oppositeRole);
        } else {
            setFilterType('all');
        }
    }, [useRealData]);

    const loadProfiles = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const profiles = await profileService.getAllProfiles(useRealData);
            setAllProfiles(profiles);
        } catch (err: any) {
            console.error('❌ Error loading profiles:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const executeSearch = async (request: MatchRequest) => {
        try {
            let searcherType = currentUser ? currentUser.role : 'patient';

            let profileId = undefined;
            if (currentUser && currentUser.id) {
                profileId = `user-${currentUser.role}-${currentUser.id}`;
            }

            const searchRequest = { ...request, searcherType, profileId };
            const response = await profileService.findMatches(searchRequest);

            if (response.success) {
                const results = response.matches || [];
                setMatches(results);
                setSearchResults(results);
                if (results.length === 0) {
                    alert('No matches found. Try adjusting your search criteria.');
                }
            } else {
                alert('Search failed. Please try again.');
            }
        } catch (error) {
            console.error('❌ Error during search:', error);
            alert('Search failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearch = async (request: MatchRequest) => {
        if (!request.profileText || !request.profileText.trim()) {
            alert('Please enter search criteria');
            return;
        }

        setIsSearching(true);
        setError(null);

        // Reset filters when a new search begins
        setActiveFilters({ bloodType: '', organType: '', ageRange: '', country: '', state: '' });

        try {
            // Check intent via AI
            const validation = await AuthService.validateInput(request.profileText, 'profile_match');

            // If it's NOT a valid match query (unrelated, news, profile fill, etc.)
            if (!validation.isValid || validation.intent !== 'profile_match') {
                setIsSearching(false);

                // Fetch user profile to check for organ type
                let userProfile: any = null;
                try {
                    const profileData = await AuthService.getProfile();
                    userProfile = profileData.profile;
                } catch (err) {
                    console.log("Could not fetch user profile.");
                }

                // If no organ type in profile
                if (!userProfile || !userProfile.organ_type) {
                    setValidationModal({
                        isOpen: true,
                        message: `Warm Reminder: This tab is for finding medical matches. Please specify what organ you are looking for (or donating) in your query, or update your profile in the "Profile Fill" tab.`,
                        suggestedAction: 'Got it'
                    });
                    return;
                }

                // If they DO have an organ type, offer to auto-search
                setValidationModal({
                    isOpen: true,
                    message: `Warm Reminder: This tab is for finding matches. We will ignore your current question and search using your saved profile (Organ: ${userProfile.organ_type}) instead.`,
                    suggestedAction: 'Help me match',
                    onConfirm: () => {
                        const profileBasedQuery = `Find matches for ${userProfile.organ_type} transplant. My blood type is ${userProfile.blood_type || 'not specified'}.`;
                        setIsSearching(true);
                        executeSearch({ ...request, profileText: profileBasedQuery });
                    }
                });
                return;
            }

            // If it's a valid match query, process normally
            await executeSearch(request);

        } catch (error) {
            console.error("Error validating search:", error);
            setIsSearching(false);
        }
    };

    const handleViewDetails = (profile: Profile, matchScore?: number) => {
        setSelectedProfile(profile);
        setSelectedMatchScore(matchScore);
    };

    const getFilteredProfiles = () => {
        let filtered = allProfiles;
        if (useRealData && currentUser && !isSponsor) {
            const targetRole = currentUser.role === 'patient' ? 'donor' : 'patient';
            filtered = filtered.filter(p => p.type === targetRole);
        }
        if (!useRealData && filterType !== 'all') {
            filtered = filtered.filter(p => p.type === filterType);
        }
        return filtered;
    };

    const filteredProfiles = getFilteredProfiles();

    // --- FILTER LOGIC ---
    const getAgeBucket = (age: number) => {
        if (age < 18) return 'Under 18';
        if (age <= 30) return '18-30';
        if (age <= 50) return '31-50';
        if (age <= 70) return '51-70';
        return '70+';
    };

    const filterOptions = useMemo(() => {
        if (matches.length === 0) return null;

        const options = {
            bloodTypes: new Set<string>(),
            organTypes: new Set<string>(),
            ageRanges: new Set<string>(),
            countries: new Set<string>(),
            states: new Set<string>(),
        };

        matches.forEach(m => {
            // HYDRATION: Try to use fresh profile data if available
            const freshProfile = allProfiles.find(p => p.id === m.profile.id);
            const p = freshProfile || m.profile;

            if (p.bloodType) options.bloodTypes.add(p.bloodType);
            if (p.organType) options.organTypes.add(p.organType);
            if (p.country) options.countries.add(p.country);
            if (p.state) options.states.add(p.state);
            if (p.age) options.ageRanges.add(getAgeBucket(p.age));
        });

        return {
            bloodTypes: Array.from(options.bloodTypes).sort(),
            organTypes: Array.from(options.organTypes).sort(),
            ageRanges: Array.from(options.ageRanges).sort(),
            countries: Array.from(options.countries).sort(),
            states: Array.from(options.states).sort(),
        };
    }, [matches, allProfiles]); // Added allProfiles dependency

    const filteredMatches = useMemo(() => {
        return matches.filter(m => {
            // HYDRATION: Filter based on fresh data
            const freshProfile = allProfiles.find(p => p.id === m.profile.id);
            const p = freshProfile || m.profile;

            if (activeFilters.bloodType && p.bloodType !== activeFilters.bloodType) return false;
            if (activeFilters.organType && p.organType !== activeFilters.organType) return false;
            if (activeFilters.country && p.country !== activeFilters.country) return false;
            if (activeFilters.state && p.state !== activeFilters.state) return false;
            if (activeFilters.ageRange && p.age && getAgeBucket(p.age) !== activeFilters.ageRange) return false;
            return true;
        });
    }, [matches, activeFilters, allProfiles]); // Added allProfiles dependency

    const handleFilterChange = (key: string, value: string) => {
        setActiveFilters(prev => ({ ...prev, [key]: value }));
    };

    if (isLoading) return <LoadingSpinner message="Loading profiles..." />;

    return (
        <div className="profile-matching-page">
            <div className="page-header">
                <h1 className="page-title">👥 Profile Matching Agent</h1>
                <p className="page-description">AI-powered patient and donor matching.</p>
            </div>

            {isSponsor ? (
                <div className="sponsor-banner">
                    <strong>👀 Sponsor View Only Mode</strong>
                    <p>
                        As a sponsor, medical matching features (Search & AI Match) are disabled for your account type.
                    </p>
                </div>
            ) : (
                <>
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
                                <span className="toggle-text">{useRealData ? '🔴 Real Matches Mode' : '🟢 Demo Mode'}</span>
                            </label>
                        </div>
                    </div>

                    <ProfileSearch onSearch={handleSearch} isSearching={isSearching} />



                    {error && <ErrorMessage message={error} onRetry={loadProfiles} />}

                    {/* --- Dynamic Filter Bar --- */}
                    {matches.length > 0 && filterOptions && (
                        <div className="filter-bar" style={{ display: 'flex', gap: '10px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', margin: '20px 0', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: '#555' }}>Filter Results:</span>

                            {/* Blood Type */}
                            {filterOptions.bloodTypes.length > 0 && (
                                <select className="form-select-sm" value={activeFilters.bloodType} onChange={(e) => handleFilterChange('bloodType', e.target.value)}>
                                    <option value="">All Blood Types</option>
                                    {filterOptions.bloodTypes.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                                </select>
                            )}

                            {/* Organ Type */}
                            {filterOptions.organTypes.length > 0 && (
                                <select className="form-select-sm" value={activeFilters.organType} onChange={(e) => handleFilterChange('organType', e.target.value)}>
                                    <option value="">All Organs</option>
                                    {filterOptions.organTypes.map(ot => <option key={ot} value={ot}>{ot}</option>)}
                                </select>
                            )}

                            {/* Age Range */}
                            {filterOptions.ageRanges.length > 0 && (
                                <select className="form-select-sm" value={activeFilters.ageRange} onChange={(e) => handleFilterChange('ageRange', e.target.value)}>
                                    <option value="">All Ages</option>
                                    {filterOptions.ageRanges.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                                </select>
                            )}

                            {/* Country Filter */}
                            {filterOptions.countries.length > 0 && (
                                <select className="form-select-sm" value={activeFilters.country} onChange={(e) => handleFilterChange('country', e.target.value)}>
                                    <option value="">All Countries</option>
                                    {filterOptions.countries.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            )}

                            {/* State Filter */}
                            {filterOptions.states.length > 0 && (
                                <select className="form-select-sm" value={activeFilters.state} onChange={(e) => handleFilterChange('state', e.target.value)}>
                                    <option value="">All States</option>
                                    {filterOptions.states.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            )}

                            <button
                                onClick={() => setActiveFilters({ bloodType: '', organType: '', ageRange: '', country: '', state: '' })}
                                style={{ marginLeft: 'auto', fontSize: '0.85rem', padding: '5px 10px', background: 'transparent', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}

                    {/* Filtered Match Results */}
                    {matches.length > 0 && (
                        <div className="browse-section">
                            <div className="browse-header">
                                <h2>✨ Match Results ({filteredMatches.length})</h2>
                                <span className={`mode-badge ${dataMode}`}>{dataMode === 'real' ? '🔴 Real Users' : '🟢 Demo Data'}</span>
                            </div>

                            <div className="profiles-grid">
                                {filteredMatches.length > 0 ? (
                                    filteredMatches.map((match) => {
                                        // --- HYDRATION FIX STARTS HERE ---
                                        // Try to find the FRESH profile from allProfiles (Source of Truth)
                                        // If found, use it. If not (e.g. vector match not in current view), fallback to match.profile
                                        const freshProfile = allProfiles.find(p => p.id === match.profile.id);
                                        const profile = freshProfile || match.profile;
                                        // --------------------------------

                                        const score = Math.round(match.similarity * 100);
                                        return (
                                            <div key={profile.id} className="profile-card-wrapper">
                                                <div className="profile-card-simple">
                                                    <div className="match-score-badge">{score}%</div>
                                                    <div className="profile-header-simple">
                                                        <h3>{profile.name}</h3>
                                                        <span className={`badge-simple ${profile.type}`}>{profile.type}</span>
                                                    </div>
                                                    <div className="profile-details-simple">
                                                        <p>🩸 {profile.bloodType || 'Not specified'}</p>
                                                        <p>🎂 {profile.age || 'N/A'} years</p>
                                                        <p>📍 {profile.city}, {profile.state}</p>
                                                        <p>💉 {profile.organType || 'Not specified'}</p>
                                                    </div>

                                                    {match.scoreBreakdown && (
                                                        <div className="score-breakdown-inline">
                                                            <span className="breakdown-pill pill-base">
                                                                🫀 Organ: {match.scoreBreakdown.baseScore}
                                                            </span>
                                                            <span className="breakdown-pill pill-blood">
                                                                🩸 Blood: +{match.scoreBreakdown.bloodTypeScore}
                                                            </span>
                                                            <span className="breakdown-pill pill-age">
                                                                🎂 Age: +{match.scoreBreakdown.ageScore}
                                                            </span>
                                                            <span className="breakdown-pill pill-loc">
                                                                📍 Loc: +{match.scoreBreakdown.locationScore}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <p className="description-simple">{profile.description?.substring(0, 100)}...</p>
                                                    <button className="view-btn-simple" onClick={() => handleViewDetails(profile, match.similarity)}>
                                                        View Details
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div style={{ width: '100%', textAlign: 'center', padding: '40px', color: '#666' }}>
                                        <p>No profiles match your selected filters.</p>
                                        <button onClick={() => setActiveFilters({ bloodType: '', organType: '', ageRange: '', country: '', state: '' })} style={{ color: '#007bff', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>
                                            Clear filters
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Browse All Profiles Section */}
                    <div className="browse-section">
                        <div className="browse-header">
                            <h2 className="browse-title">
                                {useRealData ? `📋 Available ${currentUser?.role === 'patient' ? 'Donors' : 'Patients'}` : '📋 Browse All Profiles'}
                            </h2>
                            {!useRealData && (
                                <div className="filter-tabs">
                                    <button className={`filter-tab ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>All ({allProfiles.length})</button>
                                    <button className={`filter-tab ${filterType === 'patient' ? 'active' : ''}`} onClick={() => setFilterType('patient')}>Patients</button>
                                    <button className={`filter-tab ${filterType === 'donor' ? 'active' : ''}`} onClick={() => setFilterType('donor')}>Donors</button>
                                </div>
                            )}
                        </div>

                        <div className="profiles-grid">
                            {filteredProfiles.map((profile) => (
                                <div key={profile.id} className="profile-card-wrapper">
                                    <div className="profile-card-simple">
                                        <div className="profile-header-simple">
                                            <h3>{profile.name}</h3>
                                            <span className={`badge-simple ${profile.type}`}>{profile.type}</span>
                                        </div>
                                        <p className="description-simple">{profile.description}</p>
                                        <button className="view-btn-simple" onClick={() => handleViewDetails(profile)}>
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            <ProfileDetailModal
                profile={selectedProfile}
                matchScore={selectedMatchScore}
                onClose={() => {
                    setSelectedProfile(null);
                    setSelectedMatchScore(undefined);
                }}
            />

            <ValidationModal
                isOpen={validationModal.isOpen}
                onClose={() => setValidationModal({ isOpen: false, message: '' })}
                type="tab" // Just using this for standard styling
                message={validationModal.message}
                suggestedAction={validationModal.suggestedAction || "Got it"}
                onActionClick={() => {
                    setValidationModal({ isOpen: false, message: '' });
                    if (validationModal.onConfirm) {
                        validationModal.onConfirm();
                    }
                }}
            />
        </div>
    );
};