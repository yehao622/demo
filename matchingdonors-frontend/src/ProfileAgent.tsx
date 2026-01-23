import React, { useState } from "react";

type ProfileSuggestion = {
    summary: string;
    organ_type: string | null;
    age: number | null;
    blood_type: string | null;
    location: string | null;
    personal_story: string;
    safety_flags: string[];
};

export const ProfileAgent: React.FC = () => {
    const [text, setText] = useState("");
    const [suggestion, setSuggestion] = useState<ProfileSuggestion | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            setError("Network error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: 16 }}>
            <h2>Profile Assistant Demo</h2>
            <form onSubmit={handleSubmit}>
                <textarea
                    rows={8}
                    style={{ width: "100%", marginBottom: 8 }}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Describe your situation as a patient or donor..."
                />
                <button type="submit" disabled={loading || text.trim().length < 20}>
                    {loading ? "Generating..." : "Get Suggestion"}
                </button>
            </form>

            {error && <p style={{ color: "red" }}>{error}</p>}

            {suggestion && (
                <div style={{ marginTop: 16 }}>
                    <h3>Suggested Profile</h3>
                    <p><strong>Summary:</strong> {suggestion.summary}</p>
                    <p><strong>Organ:</strong> {suggestion.organ_type ?? "Unknown"}</p>
                    <p><strong>Age:</strong> {suggestion.age ?? "Unknown"}</p>
                    <p><strong>Blood type:</strong> {suggestion.blood_type ?? "Unknown"}</p>
                    <p><strong>Location:</strong> {suggestion.location ?? "Unknown"}</p>
                    <p><strong>Story:</strong></p>
                    <p>{suggestion.personal_story}</p>
                    {suggestion.safety_flags.length > 0 && (
                        <p>
                            <strong>Safety flags:</strong> {suggestion.safety_flags.join(", ")}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};