import React, { useState } from "react";
import { useVoiceInput } from "./hooks/useVoiceInput";
import "./ProfileAgent.css";

type ProfileSuggestion = {
    summary: string;
    organ_type: string | null;
    age: number | null;
    blood_type: string | null;
    location: string | null;
    personal_story: string;
    safety_flags: string[];
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

    // Editable profile fields
    const [editableSummary, setEditableSummary] = useState("");
    const [editableOrganType, setEditableOrganType] = useState("");
    const [editableAge, setEditableAge] = useState("");
    const [editableBloodType, setEditableBloodType] = useState("");
    const [editableLocation, setEditableLocation] = useState("");
    const [editableStory, setEditableStory] = useState("");

    const { isRecording, isTranscribing, error: voiceError, handleVoiceInput } = useVoiceInput(
        (transcript) => setText(prev => prev ? prev + ' ' + transcript : transcript)
    );

    const minCharacters = 20;
    const maxCharacters = 2000;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuggestion(null);

        try {
            const res = await fetch("http://localhost:8080/api/profile/suggest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Request failed");
            } else {
                setSuggestion(data.suggestion);
                // Populate editable fields
                setEditableSummary(data.suggestion.summary);
                setEditableOrganType(data.suggestion.organ_type || "");
                setEditableAge(data.suggestion.age?.toString() || "");
                setEditableBloodType(data.suggestion.blood_type || "");
                setEditableLocation(data.suggestion.location || "");
                setEditableStory(data.suggestion.personal_story);
            }
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

    const handleSaveProfile = () => {
        setShowSaveModal(true);
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
                    {!suggestion ? (
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
        </div>
    );
};