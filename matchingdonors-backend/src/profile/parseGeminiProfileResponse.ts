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

export function parseGeminiResponse(responseText: string): ProfileSuggestion {
    try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Failed to parse Gemini response:', error);
        throw new Error('Invalid response format from AI');
    }
}