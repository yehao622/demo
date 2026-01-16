import json = require("node:stream/consumers");
import consumers = require("node:stream/consumers");

export interface ProfileSuggestion {
    summary: string,
    organ_type: string | null;
    age: number | null;
    blood_type: string | null;
    location: string | null;
    personal_story: string;
    safety_flags: string[];
}

export function parseGeminiProfileResponse(text: string): ProfileSuggestion {
    let json: any;

    try {
        json = JSON.parse(text);
    } catch {
        throw new Error("Gemini output is not valid JSON");
    }

    if (!json.personal_story || typeof json.personal_story !== "string") {
        throw new Error("Missing personal_story in Gemini response");
    }

    return {
        summary: json.summary ?? "",
        organ_type: json.organ_type ?? null,
        age: json.age ?? null,
        blood_type: json.blood_type ?? null,
        location: json.location ?? null,
        personal_story: json.personal_story.trim(),
        safety_flags: Array.isArray(json.safety_flags) ? json.safety_flags : [],
    };
}