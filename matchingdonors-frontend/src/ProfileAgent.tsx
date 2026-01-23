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
    const [interimText, setInterimText] = useState("");
    
    const recognitionRef = useRef<any>(null);
    const shouldRestartRef = useRef(false);

    const minCharacters = 20;
    const maxCharacters = 2000;

    // Initialize speech recognition
    useEffect(() => {
        if (isSpeechRecognitionSupported()) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            const recognition = new SpeechRecognition();
            
            // Configure for better continuous recognition
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                console.log('Speech recognition started');
                setRecordingError(null);
                setIsRecording(true);
            };

            recognition.onresult = (event: any) => {
                let interim = '';
                let final = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        final += transcript + ' ';
                    } else {
                        interim += transcript;
                    }
                }

                // Update interim text for display
                setInterimText(interim);

                // Add final transcript to text
                if (final) {
                    setText(prev => {
                        const newText = prev ? prev + ' ' + final : final;
                        return newText.trim();
                    });
                    setInterimText(''); // Clear interim after final
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                
                // Ignore certain errors and keep trying
                if (event.error === 'no-speech') {
                    console.log('No speech detected, waiting for speech...');
                    // Don't show error, just keep listening
                    if (shouldRestartRef.current) {
                        setTimeout(() => {
                            if (shouldRestartRef.current) {
                                try {
                                    recognition.start();
                                } catch (e) {
                                    console.log('Recognition already started');
                                }
                            }
                        }, 100);
                    }
                    return;
                } else if (event.error === 'aborted') {
                    console.log('Recognition aborted');
                    return;
                } else if (event.error === 'network') {
                    console.log('Network error - may be initialization');
                    return;
                } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
                    setRecordingError('Microphone access denied. Please allow microphone permissions and refresh.');
                    setIsRecording(false);
                } else {
                    console.log('Other error:', event.error);
                    // For other errors, try to restart if still recording
                    if (shouldRestartRef.current) {
                        setTimeout(() => {
                            if (shouldRestartRef.current) {
                                try {
                                    recognition.start();
                                } catch (e) {
                                    console.log('Could not restart:', e);
                                }
                            }
                        }, 100);
                    }
                }
            };

            recognition.onend = () => {
                console.log('Speech recognition ended');
                setInterimText('');
                
                // Auto-restart if still in recording mode
                if (shouldRestartRef.current) {
                    console.log('Auto-restarting recognition...');
                    setTimeout(() => {
                        if (shouldRestartRef.current) {
                            try {
                                recognition.start();
                            } catch (err) {
                                console.log('Could not restart recognition:', err);
                            }
                        }
                    }, 100);
                } else {
                    setIsRecording(false);
                }
            };

            recognitionRef.current = recognition;
        }

        return () => {
            shouldRestartRef.current = false;
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    console.log('Cleanup: could not stop recognition');
                }
            }
        };
    }, []);

    const startRecording = () => {
        if (!isSpeechRecognitionSupported()) {
            setRecordingError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        setRecordingError(null);
        setInterimText('');
        shouldRestartRef.current = true;
        
        try {
            recognitionRef.current?.start();
            setIsRecording(true);
        } catch (err: any) {
            console.error('Error starting recognition:', err);
            if (err.message && err.message.includes('already started')) {
                // Already running, just update state
                setIsRecording(true);
            } else {
                setIsRecording(false);
                shouldRestartRef.current = false;
                setRecordingError('Failed to start recording. Please refresh and try again.');
            }
        }
    };

    const stopRecording = () => {
        shouldRestartRef.current = false;
        setIsRecording(false);
        setInterimText('');
        
        try {
            recognitionRef.current?.stop();
        } catch (e) {
            console.log('Error stopping recognition:', e);
        }
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        
        // Stop recording if active
        if (isRecording) {
            stopRecording();
        }
        
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
        setInterimText('');
    };

    const characterCount = text.length;
    const isValid = characterCount >= minCharacters && characterCount <= maxCharacters;
    const displayText = text + (interimText ? ' ' + interimText : '');

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
                                            title={isRecording ? 'Click to stop recording' : 'Click to start voice input'}
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
                                    value={displayText}
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
                                    ✅ Listening... Speak clearly into your microphone. Your words will appear above.
                                    {interimText && <div className="interim-text">Hearing: "{interimText}"</div>}
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
                                disabled={loading || !isValid}
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