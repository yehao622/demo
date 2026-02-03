import db from '../database';
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
}
const google = new GoogleGenAI({ apiKey: apiKey || "" });

export interface ProfileData {
    id?: string;
    user_id: number;
    name: string;
    type: 'patient' | 'donor';
    blood_type: string;
    age: number;
    country: string;
    state: string;
    city: string;
    organ_type: string;
    description: string;
    medical_info: string;
    preferences: string;
    is_complete?: boolean;
}

export interface ProfileValidation {
    isValid: boolean;
    roleMismatch?: {
        detected: boolean;
        message: string;
        suggestedRole: 'patient' | 'donor';
    };
    tabMismatch?: {
        detected: boolean;
        message: string;
        suggestedTab: string;
    };
}

export class ProfileService {
    // Check if user has a complete profile
    static hasCompleteProfile(userId: number, role: 'patient' | 'donor'): boolean {
        const profile = db.prepare(`
            SELECT * FROM profiles 
            WHERE user_id = ? AND type = ? AND is_complete = 1
        `).get(userId, role);

        return !!profile;
    }

    static getAllCompleteProfiles(
        targetType: 'patient' | 'donor',
        excludeUserId?: number
    ): ProfileData[] {
        let query = `
            SELECT * FROM profiles 
            WHERE type = ? AND is_complete = 1
        `;
        const params: any[] = [targetType];

        if (excludeUserId) {
            query += ' AND user_id != ?';
            params.push(excludeUserId);
        }

        query += ' ORDER BY updated_at DESC';

        const profiles = db.prepare(query).all(...params) as ProfileData[];
        return profiles;
    }

    // Get user's profile
    static getUserProfile(userId: number, role: 'patient' | 'donor'): ProfileData | null {
        const profile = db.prepare(`
            SELECT * FROM profiles 
            WHERE user_id = ? AND type = ?
        `).get(userId, role) as ProfileData | undefined;

        return profile || null;
    }

    // Create or update user profile
    static saveProfile(data: ProfileData): ProfileData {
        const {
            user_id,
            name,
            type,
            blood_type,
            age,
            country,
            state,
            city,
            organ_type,
            description,
            medical_info,
            preferences,
        } = data;

        // Check if profile is complete (organ_type, age, blood_type required)
        const is_complete = !!(organ_type && age && blood_type);

        // Check if profile exists
        const existing = this.getUserProfile(user_id, type);

        if (existing) {
            // Update existing profile
            const stmt = db.prepare(`
                UPDATE profiles 
                SET name = ?, blood_type = ?, age = ?, country = ?, state = ?, 
                    city = ?, organ_type = ?, description = ?, medical_info = ?, 
                    preferences = ?, is_complete = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ? AND type = ?
            `);

            stmt.run(
                name, blood_type, age, country, state, city, organ_type,
                description, medical_info, preferences, is_complete ? 1 : 0,
                user_id, type
            );

            return this.getUserProfile(user_id, type)!;
        } else {
            // Create new profile
            const id = `user-${type}-${user_id}-${Date.now()}`;
            const stmt = db.prepare(`
                INSERT INTO profiles (
                    id, user_id, name, type, blood_type, age, country, state, 
                    city, organ_type, description, medical_info, preferences, is_complete
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                id, user_id, name, type, blood_type, age, country, state,
                city, organ_type, description, medical_info, preferences, is_complete ? 1 : 0
            );

            return this.getUserProfile(user_id, type)!;
        }
    }

    // Validate user input for role/tab mismatches using AI
    static async validateUserInput(
        userInput: string,
        userRole: 'patient' | 'donor',
        currentTab: 'profile_fill' | 'profile_match' | 'news_hub' | 'advertiser_chat'
    ): Promise<ProfileValidation> {

        const prompt = `You are a medical platform assistant. Analyze the user's input for potential mismatches.

User Role: ${userRole}
Current Tab: ${currentTab}
User Input: "${userInput}"

Analyze for:
1. **Role Mismatch**: Does a PATIENT talk about donating organs? Or does a DONOR talk about needing organs?
2. **Tab Mismatch**: Is the user asking for features from another tab?
   - Profile Fill: Create/edit personal medical profile
   - Profile Match: Find compatible donors/patients
   - News Hub: Medical news and articles
   - Advertiser Chat: Advertising inquiries

Respond in JSON format:
{
  "roleMismatch": {
    "detected": boolean,
    "confidence": "high" | "medium" | "low",
    "reason": "brief explanation",
    "suggestedRole": "patient" | "donor" | null
  },
  "tabMismatch": {
    "detected": boolean,
    "confidence": "high" | "medium" | "low",
    "reason": "brief explanation",
    "suggestedTab": "profile_fill" | "profile_match" | "news_hub" | "advertiser_chat" | null
  }
}

Only flag issues with "high" confidence. Be lenient with ambiguous statements.`;

        try {
            const response = await google.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            const rawText = response.text;
            if (!rawText) {
                console.warn('No text response from Gemini');
                return { isValid: true };
            }
            const text = rawText.trim();

            // Parse JSON response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return { isValid: true };
            }

            const analysis = JSON.parse(jsonMatch[0]);

            const result: ProfileValidation = {
                isValid: true,
            };

            // Check role mismatch
            if (analysis.roleMismatch?.detected && analysis.roleMismatch.confidence === 'high') {
                result.isValid = false;
                result.roleMismatch = {
                    detected: true,
                    message: `It looks like you're registered as a ${userRole}, but your request suggests you might want to be a ${analysis.roleMismatch.suggestedRole}. Please register with the correct role to proceed.`,
                    suggestedRole: analysis.roleMismatch.suggestedRole,
                };
            }

            // Check tab mismatch
            if (analysis.tabMismatch?.detected && analysis.tabMismatch.confidence === 'high') {
                result.isValid = false;
                const tabNames: Record<string, string> = {
                    profile_fill: 'Profile Fill',
                    profile_match: 'Profile Match',
                    news_hub: 'News Hub',
                    advertiser_chat: 'Advertiser Chat',
                };

                const suggestedTab = analysis.tabMismatch.suggestedTab;
                if (suggestedTab && tabNames[suggestedTab]) {
                    result.tabMismatch = {
                        detected: true,
                        message: `This request is better suited for the "${tabNames[suggestedTab]}" tab.`,
                        suggestedTab: tabNames[suggestedTab],
                    };
                }
            }

            return result;
        } catch (error) {
            console.error('AI validation error:', error);
            // On error, allow the request
            return { isValid: true };
        }
    }

    // Delete user profile
    static deleteProfile(userId: number, role: 'patient' | 'donor'): boolean {
        const stmt = db.prepare(`
            DELETE FROM profiles WHERE user_id = ? AND type = ?
        `);
        const result = stmt.run(userId, role);
        return result.changes > 0;
    }
}