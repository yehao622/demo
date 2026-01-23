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
    const isActiveRef = useRef(false);

    const minCharacters = 20;
    const maxCharacters = 2000;

    // Initialize speech recognition once
    useEffect(() => {
        if (!isSpeechRecognitionSupported()) {
            return;
        }

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        // Configure for continuous recognition
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            console.log('✅ Speech recognition started successfully');
            setIsRecording(true);
            setRecordingError(null);
        };

        recognition.onresult = (event: any) => {
            console.log('📝 Got speech result');
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcript + ' ';
                    console.log('Final transcript:', transcript);
                } else {
                    interim += transcript;
                }
            }

            // Update interim text for live feedback
            if (interim) {
                setInterimText(interim);
            }

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
            console.error('❌ Speech recognition error:', event.error);
            
            if (event.error === 'not-allowed' || event.error === 'permission-denied') {
                setRecordingError('Microphone access denied. Please allow microphone permissions.');
                setIsRecording(false);
                isActiveRef.current = false;
            } else if (event.error === 'no-speech') {
                // Don't show error for no-speech, it's normal during pauses
                console.log('No speech detected, but continuing to listen...');
            } else if (event.error === 'network') {
                // Ignore network errors during startup
                console.log('Network error (likely false positive)');
            } else {
                console.log('Other error:', event.error);
            }
        };

        recognition.onend = () => {
            console.log('🛑 Speech recognition ended');
            setInterimText('');
            
            // Only restart if we're still supposed to be recording
            if (isActiveRef.current) {
                console.log('⚠️ Recognition ended unexpectedly, restarting...');
                setTimeout(() => {
                    if (isActiveRef.current) {
                        try {
                            recognition.start();
                        } catch (err) {
                            console.log('Could not restart:', err);
                            setIsRecording(false);
                        }
                    }
                }, 200); // Small delay before restart
            } else {
                setIsRecording(false);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            isActiveRef.current = false;
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) {
                    console.log('Cleanup: error stopping recognition');
                }
            }
        };
    }, []);

    const startRecording = () => {
        if (!isSpeechRecognitionSupported()) {
            setRecordingError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        console.log('🎤 Starting recording...');
        setRecordingError(null);
        setInterimText('');
        isActiveRef.current = true;
        
        try {
            recognitionRef.current.start();
            console.log('Recognition.start() called');
        } catch (err: any) {
            console.error('Error starting:', err);
            if (err.message && err.message.includes('already started')) {
                console.log('Already started, just updating state');
                setIsRecording(true);
            } else {
                setIsRecording(false);
                isActiveRef.current = false;
                setRecordingError('Failed to start recording. Please try again.');
            }
        }
    };

    const stopRecording = () => {
        console.log('⏹️ Stopping recording...');
        isActiveRef.current = false;
        setIsRecording(false);
        setInterimText('');
        
        try {
            recognitionRef.current?.stop();
        } catch (e) {
            console.log('Error stopping:', e);
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
                                    ✅ Listening... Speak clearly and naturally. The microphone indicator should stay solid (not flashing).
                                    {interimText && (
                                        <div className="interim-text">
                                            Hearing: "{interimText}"
                                        </div>
                                    )}
                                </div>
                            )}

                            {recordingError && (
                                <div className="error-message">
                                    ❌ {recordingError}
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