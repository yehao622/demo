import React, { useState } from "react";
import { useVoiceInput } from "../../hooks/useVoiceInput";
import "./ProfileAgent.css";
import '../../styles/shared-voice-input.css';
import { useAuth } from "../../contexts/AuthContext";
import { AuthService } from "../../services/auth.service";
import { ValidationModal } from "../common/ValidationModal";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

type ProfileSuggestion = {
    summary: string;
    organ_type: string | null;
    age: number | null;
    blood_type: string | null;
    location: string | null;
    personal_story: string;
    safety_flags: string[];
};

const tabRoutes: Record<string, string> = {
    'Profile Fill': '/profile-fill',
    'Profile Match': '/profile-match',
    'News Hub': '/news-hub',
    'Advertiser Chat': '/advertiser-chat'
};

// Check if browser supports MediaRecorder
const isMediaRecorderSupported = () => {
    return typeof MediaRecorder !== 'undefined';
};

export const ProfileAgent: React.FC = () => {
    const [text, setText] = useState("");
    const [suggestion, setSuggestion] = useState<ProfileSuggestion | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const navigate = useNavigate();

    // Editable profile fields
    const [editableSummary, setEditableSummary] = useState("");
    const [editableOrganType, setEditableOrganType] = useState("");
    const [editableAge, setEditableAge] = useState("");
    const [editableBloodType, setEditableBloodType] = useState("");
    const [editableLocation, setEditableLocation] = useState("");
    const [editableStory, setEditableStory] = useState("");
    const [existingProfile, setExistingProfile] = useState<any>(null);
    const [isPublic, setIsPublic] = useState(true);
    // const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);

    const { isRecording, isTranscribing, error: voiceError, handleVoiceInput } = useVoiceInput(
        (transcript) => setText(prev => prev ? prev + ' ' + transcript : transcript)
    );

    const { user, triggerRegistration } = useAuth();
    const [validationModal, setValidationModal] = useState<{
        isOpen: boolean;
        type: 'role' | 'tab';
        message: string;
        suggestedAction?: string;
    }>({ isOpen: false, type: 'role', message: '' });

    // Add this useEffect to load existing profile
    React.useEffect(() => {
        const loadExistingProfile = async () => {
            if (user) {
                try {
                    const profileData = await AuthService.getProfile();
                    if (profileData.profile) {
                        // Load visibility status
                        if (typeof profileData.profile.is_public === 'boolean') {
                            setIsPublic(profileData.profile.is_public);
                        }
                        setExistingProfile(profileData.profile);
                    }
                } catch (err) {
                    console.log('No existing profile found');
                }
            }
        };
        loadExistingProfile();
    }, [user]);

    const minCharacters = 20;
    const maxCharacters = 2000;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuggestion(null);

        try {
            // Validate input first if user is authenticated
            if (user) {
                const validation = await AuthService.validateInput(text, 'profile_fill');

                if (!validation.isValid) {
                    setLoading(false);

                    // Show role mismatch
                    if (validation.roleMismatch?.detected || validation.tabMismatch?.detected) {
                        setValidationModal({
                            isOpen: true,
                            type: validation.roleMismatch?.detected ? 'role' : 'tab',
                            message: validation.roleMismatch?.message || validation.tabMismatch?.message,
                            suggestedAction: validation.roleMismatch?.detected
                                ? 'Go to Registration'
                                : `Go to ${validation.tabMismatch?.suggestedTab}`,
                        });
                        return;
                    }

                    // Need tontact a real person
                    if (validation.intent === 'contact_person') {
                        setValidationModal({
                            isOpen: true,
                            type: 'tab', // Reusing modal UI
                            message: "To speak with a real person, please contact: Paul Dooley (CEO & Founder) at ceo@matchingdonors.com or +1-781-821-2204 (ext. 1).",
                            suggestedAction: 'Got it'
                        });
                        return;
                    }

                    // Query on unrelated content
                    if (validation.intent === 'unrelated') {
                        setValidationModal({
                            isOpen: true,
                            type: 'tab',
                            message: "The 'Profile Fill' tab is specifically for creating your medical matching biography. Please describe your situation, blood type, and location here.",
                            suggestedAction: 'Got it'
                        });
                        return;
                    }
                }
            }

            const response = await api.post("/api/profile/suggest", { text });

            const data = response.data;
            setSuggestion(data.suggestion);

            // Extract existing database fields (handling both camel and snake case)
            const safeBlood = existingProfile?.blood_type || "";
            const safeOrgan = existingProfile?.organ_type || "";
            const safeStory = existingProfile?.medical_info || "";
            const safeDesc = existingProfile?.description || "";
            const safeAge = existingProfile?.age?.toString() || "";
            const savedLoc = existingProfile?.city ? `${existingProfile.city}, ${existingProfile.state}` : "";

            setEditableSummary(safeDesc + '\n' + data.suggestion.summary);
            setEditableOrganType(data.suggestion.organ_type || safeOrgan);
            setEditableAge(data.suggestion.age?.toString() || safeAge);
            setEditableBloodType(data.suggestion.blood_type || safeBlood);
            setEditableLocation(data.suggestion.location || savedLoc);
            setEditableStory(safeStory + '\n' + data.suggestion.personal_story);
        } catch (err: any) {
            setError("Unable to connect to the server. Please check if the backend is running.");
        } finally {
            setLoading(false);
        }
    }

    const handleNewProfile = () => {
        setText("");
        setSuggestion(null);
        setError(null);
        // Clear editable fields
        setEditableSummary("");
        setEditableOrganType("");
        setEditableAge("");
        setEditableBloodType("");
        setEditableLocation("");
        setEditableStory("");
    };

    const handleSaveProfile = async () => {
        try {
            if (!user) {
                setError('You must be logged in to save your profile');
                return;
            }

            const savedProfile = await AuthService.saveProfile({
                summary: editableSummary,
                organType: editableOrganType,
                age: editableAge,
                bloodType: editableBloodType,
                location: editableLocation,
                personalStory: editableStory,
                isPublic: isPublic,
            });

            // Load visibility status from saved profile
            if (savedProfile.profile && typeof savedProfile.profile.is_public !== 'undefined') {
                const publicStatus = savedProfile.profile.is_public === 1 || savedProfile.profile.is_public === true;
                setIsPublic(publicStatus);
            }

            setShowSaveModal(true);
        } catch (err: any) {
            setError(err.message || 'Failed to save profile');
        }
    };

    const closeSaveModal = () => {
        setShowSaveModal(false);
    };

    const characterCount = text.length;
    const isValid = characterCount >= minCharacters && characterCount <= maxCharacters;

    return (
        <div className="profile-agent-container">
            <div className="profile-agent-card">
                <div className="profile-agent-header">
                    <h2>🏥 Profile Filling Assistant</h2>
                    <p>
                        AI-powered profile generation for patients and donors.<br />
                        Describe your situation by typing or speaking, and we'll help you create a comprehensive profile.
                    </p>
                </div>

                <div className="profile-agent-content">
                    {user?.role === 'sponsor' ? (
                        <div className="sponsor-notice-container">
                            <div className="sponsor-notice-icon">🤝</div>
                            <h3 className="sponsor-notice-title">Sponsor Account Detected</h3>
                            <p className="sponsor-notice-text">
                                <strong>You do not need to fill out a medical profile.</strong>
                                <br />
                                This tool is designed for Patients and Donors to describe their medical history.
                                <br /><br />
                                To manage your organization's details, please click your name in the top right corner and select <strong>"Edit Profile"</strong>.
                            </p>
                        </div>
                    ) : (
                        !suggestion ? (
                            <form onSubmit={handleSubmit} className="profile-form">
                                <div className="form-section">
                                    <div className="form-label-with-actions">
                                        <label className="form-label" htmlFor="profile-input">
                                            Describe Your Situation
                                        </label>
                                        {isMediaRecorderSupported() && (
                                            <button
                                                type="button"
                                                className={`audio-button ${isRecording ? 'recording' : ''}`}
                                                onClick={handleVoiceInput}
                                                disabled={loading || isTranscribing}
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
                                        )}
                                    </div>
                                    <textarea
                                        id="profile-input"
                                        className="profile-textarea"
                                        rows={10}
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        placeholder="Example: My name is Tom, 34 years old with A blood type, and I need a kidney to maintain my health for the rest of 20 years. I live in Boston, MA, USA. If there is potential donor, I'm willing to consult and travel..."
                                        disabled={loading}
                                    />
                                    <div
                                        className={`character-count ${characterCount > maxCharacters
                                            ? "error"
                                            : characterCount < minCharacters
                                                ? "warning"
                                                : ""
                                            }`}
                                    >
                                        {characterCount} / {maxCharacters} characters
                                        {characterCount < minCharacters &&
                                            ` (minimum ${minCharacters})`}
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

                                {error && <div className="error-message">❌ {error}</div>}

                                <button
                                    type="submit"
                                    className="submit-button"
                                    disabled={loading || !isValid || isTranscribing}
                                >
                                    {loading ? "Generating Profile..." : "Generate Profile Suggestion"}
                                </button>

                                {loading && (
                                    <div className="loading-container">
                                        <div className="loading-spinner"></div>
                                        <span className="loading-text">
                                            Analyzing your information with AI...
                                        </span>
                                    </div>
                                )}
                            </form>
                        ) : (
                            <div className="suggestion-container">
                                <div className="suggestion-header">
                                    <span className="suggestion-icon">✨</span>
                                    <h3>Edit Your Profile</h3>
                                    <p className="edit-hint">Review and modify the AI-generated profile below</p>
                                </div>

                                <div className="suggestion-content">
                                    <div className="editable-form">
                                        <div className="form-group">
                                            <label className="edit-label">Summary:</label>
                                            <textarea
                                                className="edit-input edit-textarea"
                                                value={editableSummary}
                                                onChange={(e) => setEditableSummary(e.target.value)}
                                                rows={2}
                                            />
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="edit-label">Organ Type:</label>
                                                <input
                                                    type="text"
                                                    className="edit-input"
                                                    value={editableOrganType}
                                                    onChange={(e) => setEditableOrganType(e.target.value)}
                                                    placeholder="e.g., kidney, liver, heart"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="edit-label">Age:</label>
                                                <input
                                                    type="text"
                                                    className="edit-input"
                                                    value={editableAge}
                                                    onChange={(e) => setEditableAge(e.target.value)}
                                                    placeholder="e.g., 34"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="edit-label">Blood Type:</label>
                                                <input
                                                    type="text"
                                                    className="edit-input"
                                                    value={editableBloodType}
                                                    onChange={(e) => setEditableBloodType(e.target.value)}
                                                    placeholder="e.g., A+, O-, AB+"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="edit-label">Location:</label>
                                                <input
                                                    type="text"
                                                    className="edit-input"
                                                    value={editableLocation}
                                                    onChange={(e) => setEditableLocation(e.target.value)}
                                                    placeholder="e.g., Boston, MA, USA"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="edit-label">📝 Personal Story:</label>
                                            <textarea
                                                className="edit-input edit-textarea"
                                                value={editableStory}
                                                onChange={(e) => setEditableStory(e.target.value)}
                                                rows={4}
                                            />
                                        </div>
                                    </div>

                                    {suggestion.safety_flags.length > 0 && (
                                        <div className="safety-flags">
                                            <div className="safety-flags-label">
                                                <span>⚠️</span>
                                                <strong>Safety Considerations:</strong>
                                            </div>
                                            <p className="safety-flags-list">
                                                {suggestion.safety_flags.join(", ")}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="action-buttons">
                                    <button className="btn btn-success" onClick={handleSaveProfile}>
                                        💾 Save Profile
                                    </button>
                                    <button className="btn btn-secondary" onClick={handleNewProfile}>
                                        ➕ Create New Profile
                                    </button>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Save Confirmation Modal */}
            {showSaveModal && (
                <div className="modal-overlay" onClick={closeSaveModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <span className="modal-icon">✅</span>
                            <h3>Profile Saved!</h3>
                        </div>
                        <div className="modal-body">
                            <p><strong>Demo Mode:</strong> Profile saved in memory only.</p>
                            <p>In production, this would be stored in the database and available for matching with donors/patients.</p>
                            <div className="saved-profile-preview">
                                <p><strong>Summary:</strong> {editableSummary}</p>
                                <p><strong>Organ Type:</strong> {editableOrganType || "Not specified"}</p>
                                <p><strong>Age:</strong> {editableAge || "Not specified"}</p>
                                <p><strong>Blood Type:</strong> {editableBloodType || "Not specified"}</p>
                                <p><strong>Location:</strong> {editableLocation || "Not specified"}</p>
                                <p><strong>Personal Story:</strong> {editableStory || "Not specified"}</p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={closeSaveModal}>
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ValidationModal
                isOpen={validationModal.isOpen}
                onClose={() => {
                    setValidationModal({ ...validationModal, isOpen: false });
                    setLoading(false);
                }}
                type={validationModal.type}
                message={validationModal.message}
                suggestedAction={validationModal.suggestedAction}
                onActionClick={() => {
                    if (validationModal.type === 'tab') {
                        const route = tabRoutes[validationModal.suggestedAction?.replace('Go to ', '') || ''];
                        if (route) {
                            navigate(route);
                        }
                    } else if (validationModal.type === 'role') {
                        const suggestedRole = validationModal.message.toLowerCase().includes('donor') ? 'donor' : 'patient';
                        triggerRegistration(suggestedRole);
                    }
                    setValidationModal({ ...validationModal, isOpen: false });
                    setLoading(false);
                }}
            />
        </div>
    );
};