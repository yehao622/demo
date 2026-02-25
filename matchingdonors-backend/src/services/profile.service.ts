import db from '../database';
import { GoogleGenAI } from "@google/genai";
import { BaseProfile } from '../models/profile.model';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
}
const google = new GoogleGenAI({ apiKey: apiKey || "" });

export interface ProfileValidation {
    isValid: boolean;
    intent?: string;
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
    // Helper to normalize database boolean (0/1) to TypeScript boolean
    private static mapFromDb(row: any): BaseProfile {
        return {
            ...row,
            is_complete: row.is_complete === 1,
            is_public: row.is_public === 1
        };
    }

    // Check if user has a complete profile
    static hasCompleteProfile(userId: number, role: 'patient' | 'donor'): boolean {
        const profile = db.prepare(`
            SELECT * FROM profiles 
            WHERE user_id = ? AND type = ? AND is_complete = 1
        `).get(userId, role);

        return !!profile;
    }

    // Get ALL profiles for Demo Mode (no filtering)
    static getAllProfilesForDemo(currentUserId?: number): BaseProfile[] {
        let query = `
        SELECT * FROM profiles 
        WHERE is_public = 1
    `;

        const params: any[] = [];

        // Include current user's profile even if private
        if (currentUserId) {
            query += ` OR user_id = ?`;
            params.push(currentUserId);
        }

        query += ` ORDER BY is_complete DESC, updated_at DESC`;

        const profiles = db.prepare(query).all(...params) as BaseProfile[];
        // console.log(`📋 Demo Mode: Loaded ${profiles.length} total profiles (including user ${currentUserId || 'none'})`);
        return profiles;
    }

    static getAllCompleteProfiles(
        targetType: 'patient' | 'donor',
        excludeUserId?: number,
    ): BaseProfile[] {
        let query = `
            SELECT * FROM profiles 
            WHERE type = ? AND is_public = 1
        `;

        const params: any[] = [targetType];

        if (excludeUserId) {
            query += ' AND user_id != ?';
            params.push(excludeUserId);
        }

        query += ' ORDER BY is_complete DESC, updated_at DESC';

        const profiles = db.prepare(query).all(...params) as BaseProfile[];
        return profiles;
    }

    // Get user's profile
    static getUserProfile(userId: number, role: 'patient' | 'donor'): BaseProfile | null {
        const profile = db.prepare(`
            SELECT * FROM profiles 
            WHERE user_id = ? AND type = ?
        `).get(userId, role);

        return profile ? this.mapFromDb(profile) : null;
    }

    // Create or update user profile
    static saveProfile(data: BaseProfile): BaseProfile {
        // Check if profile is complete (organ_type, age, blood_type required)
        const is_complete = !!(data.organ_type && data.age && data.blood_type);

        // Check if profile exists
        const existing = this.getUserProfile(data.user_id, data.type);

        if (existing) {
            // Update existing profile
            const stmt = db.prepare(`
                UPDATE profiles 
                SET name = ?, blood_type = ?, age = ?, country = ?, state = ?, 
                    city = ?, organ_type = ?, description = ?, medical_info = ?, 
                    preferences = ?, is_complete = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ? AND type = ?
            `);

            stmt.run(
                data.name, data.blood_type, data.age, data.country, data.state, data.city, data.organ_type,
                data.description, data.medical_info, data.preferences, is_complete ? 1 : 0, data.is_public ? 1 : 0,
                data.user_id, data.type
            );
        } else {
            // Create new profile
            const id = data.id || `user-${data.type}-${data.user_id}-${Date.now()}`;
            const stmt = db.prepare(`
                INSERT INTO profiles (
                    id, user_id, name, type, blood_type, age, country, state, 
                    city, organ_type, description, medical_info, preferences, is_complete, is_public
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                id, data.user_id, data.name, data.type, data.blood_type, data.age, data.country, data.state,
                data.city, data.organ_type, data.description, data.medical_info, data.preferences, is_complete ? 1 : 0, data.is_public ? 1 : 0
            );
        }

        return this.getUserProfile(data.user_id, data.type)!;
    }

    // Validate user input for role/tab mismatches using AI
    static async validateUserInput(
        userInput: string,
        userRole: 'patient' | 'donor',
        currentTab: 'profile_fill' | 'profile_match' | 'news_hub' | 'advertiser_chat'
    ): Promise<ProfileValidation> {

        const prompt = `You are a medical platform assistant for MatchingDonors. Analyze the user's input.

User Role: ${userRole}
Current Tab: ${currentTab}
User Input: "${userInput}"

ANALYSIS CRITERIA:
1. **Role Mismatch**: 
   - CRITICAL: If User Role is "patient" and they mention "donating", "giving", or "offering" an organ -> MISMATCH.
   - CRITICAL: If User Role is "donor" and they mention "needing", "receiving", or "waiting for" an organ -> MISMATCH.
2. **Tab Mismatch**: 
   - Profile Fill: Describing oneself/personal story.
   - Profile Match: Searching/asking to see a list of results.
3. **Contact Intent**: Is the user asking to speak to a real person, a human, or the CEO?
4. **Unrelated**: Is the input unrelated to medical matching or this platform (e.g., weather, sports)?

Respond in JSON:
{
  "intent": "profile_fill" | "profile_match" | "news_hub" | "advertiser_chat" | "contact_person" | "unrelated",
  "roleMismatch": { "detected": boolean, "suggestedRole": "patient" | "donor" | null, "confidence": "high" | "medium" | "low" },
  "tabMismatch": { "detected": boolean, "suggestedTab": string | null, "confidence": "high" | "medium" | "low" },
  "reason": "brief explanation"
}`;

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
                intent: analysis.intent,
            };

            // Explicitly mark as INVALID if intent is unrelated or contact_person
            if (analysis.intent === 'unrelated' || analysis.intent === 'contact_person') {
                result.isValid = false;
            }

            // Check role mismatch
            const roleConf = analysis.roleMismatch?.confidence;
            if (analysis.roleMismatch?.detected && (roleConf === 'high' || roleConf === 'medium')) {
                result.isValid = false;
                result.roleMismatch = {
                    detected: true,
                    message: `It looks like you're registered as a ${userRole}, but your request suggests you might want to be a ${analysis.roleMismatch.suggestedRole}. Please register with the correct role to proceed.`,
                    suggestedRole: analysis.roleMismatch.suggestedRole,
                };
            }

            // Check tab mismatch
            const tabConf = analysis.tabMismatch?.confidence;
            if (analysis.tabMismatch?.detected && (tabConf === 'high' || tabConf === 'medium')) {
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

    // Toggle profile visibility
    static toggleProfileVisibility(userId: number, role: 'patient' | 'donor', isPublic: boolean): BaseProfile | null {
        const stmt = db.prepare(`
        UPDATE profiles 
        SET is_public = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND type = ?
    `);

        stmt.run(isPublic ? 1 : 0, userId, role);

        return this.getUserProfile(userId, role);
    }

}