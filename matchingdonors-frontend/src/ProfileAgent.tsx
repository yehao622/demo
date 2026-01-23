import React, { useState, useRef, useEffect } from "react";
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

// Check if browser supports Web Speech API
const isSpeechRecognitionSupported = () => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

export const ProfileAgent: React.FC = () => {
    const [text, setText] = useState("");
    const [suggestion, setSuggestion] = useState<ProfileSuggestion | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingError, setRecordingError] = useState<string | null>(null);
    const [hasRecognizedSpeech, setHasRecognizedSpeech] = useState(false);
    
    const recognitionRef = useRef<any>(null);

    const minCharacters = 20;
    const maxCharacters = 2000;

    // Initialize speech recognition
    useEffect(() => {
        if (isSpeechRecognitionSupported()) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            const recognition = new SpeechRecognition();
            
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setRecordingError(null);
                setHasRecognizedSpeech(false);
            };

            recognition.onresult = (event: any) => {
                setHasRecognizedSpeech(true);
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                if (finalTranscript) {
                    setText(prev => {
                        const newText = prev ? prev + ' ' + finalTranscript : finalTranscript;
                        return newText.trim();
                    });
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                
                // Ignore network errors during initialization - they're false positives
                if (event.error === 'network' && !hasRecognizedSpeech) {
                    console.log('Ignoring initial network error - this is normal');
                    return;
                }
                
                setIsRecording(false);
                
                if (event.error === 'no-speech') {
                    setRecordingError('No speech detected. Please speak into your microphone.');
                } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
                    setRecordingError('Microphone access denied. Please allow microphone permissions and refresh the page.');
                } else if (event.error === 'network') {
                    setRecordingError('Network error. Speech recognition requires an internet connection.');
                } else if (event.error === 'aborted') {
                    // User stopped recording, don't show error
                    return;
                } else {
                    setRecordingError(`Recognition error: ${event.error}. Please try again.`);
                }
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    // Ignore errors on cleanup
                }
            }
        };
    }, [hasRecognizedSpeech]);

    const startRecording = () => {
        if (!isSpeechRecognitionSupported()) {
            setRecordingError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        setRecordingError(null);
        setIsRecording(true);
        setHasRecognizedSpeech(false);
        
        try {
            recognitionRef.current?.start();
        } catch (err: any) {
            console.error('Error starting recognition:', err);
            setIsRecording(false);
            if (err.message && err.message.includes('already started')) {
                // Recognition already running, just set state
                setIsRecording(true);
            } else {
                setRecordingError('Failed to start recording. Please try again.');
            }
        }
    };

    const stopRecording = () => {
        setIsRecording(false);
        try {
            recognitionRef.current?.stop();
        } catch (e) {
            // Ignore errors on stop
        }
    };

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
        setRecordingError(null);
        setHasRecognizedSpeech(false);
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
                                    {isSpeechRecognitionSupported() && (
                                        <button
                                            type="button"
                                            className={`audio-button ${isRecording ? 'recording' : ''}`}
                                            onClick={isRecording ? stopRecording : startRecording}
                                            disabled={loading}
                                            title={isRecording ? 'Stop recording' : 'Start voice input'}
                                        >
                                            {isRecording ? (
                                                <>
                                                    <span className="recording-pulse"></span>
                                                    🎤 Recording...
                                                </>
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
                                    className={`character-count ${
                                        characterCount > maxCharacters
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

                            {isRecording && !recordingError && (
                                <div className="success-message">
                                    ✅ Listening... Speak now and your words will appear in the text box.
                                </div>
                            )}

                            {recordingError && (
                                <div className="info-message">
                                    ℹ️ {recordingError}
                                </div>
                            )}

                            {error && <div className="error-message">❌ {error}</div>}

                            <button
                                type="submit"
                                className="submit-button"
                                disabled={loading || !isValid || isRecording}
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
                                <h3>Suggested Profile</h3>
                            </div>

                            <div className="suggestion-content">
                                <div className="info-card">
                                    <div className="info-row">
                                        <span className="info-label">Summary:</span>
                                        <span className="info-value">{suggestion.summary}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Organ Type:</span>
                                        <span
                                            className={`info-value ${
                                                !suggestion.organ_type ? "unknown" : ""
                                            }`}
                                        >
                                            {suggestion.organ_type || "Not specified"}
                                        </span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Age:</span>
                                        <span
                                            className={`info-value ${!suggestion.age ? "unknown" : ""}`}
                                        >
                                            {suggestion.age || "Not specified"}
                                        </span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Blood Type:</span>
                                        <span
                                            className={`info-value ${
                                                !suggestion.blood_type ? "unknown" : ""
                                            }`}
                                        >
                                            {suggestion.blood_type || "Not specified"}
                                        </span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Location:</span>
                                        <span
                                            className={`info-value ${
                                                !suggestion.location ? "unknown" : ""
                                            }`}
                                        >
                                            {suggestion.location || "Not specified"}
                                        </span>
                                    </div>
                                </div>

                                <div className="story-section">
                                    <h4>📝 Personal Story</h4>
                                    <p className="story-text">{suggestion.personal_story}</p>
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
                                <button className="btn btn-primary" onClick={handleNewProfile}>
                                    Create New Profile
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};