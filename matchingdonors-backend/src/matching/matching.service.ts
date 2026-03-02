import { GoogleGenAI } from '@google/genai';
import { BaseProfile } from '../models/profile.model';
import { MatchResult } from './matching.types';

export class MatchingService {
    private genAI: GoogleGenAI;
    private embeddingModel: string = 'gemini-embedding-001';

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY not found in environment variables');
        }
        this.genAI = new GoogleGenAI({ apiKey });
    }

    // 1. Generate Embedding (Keep as is)
    async generateEmbedding(text: string): Promise<number[]> {
        // This prevents the Gemini API from crashing on empty "Match Me" searches.
        if (!text || !text.trim()) {
            return new Array(100).fill(0);
        }

        try {
            const response = await this.genAI.models.embedContent({
                model: this.embeddingModel,
                contents: text,
            });
            if (!response.embeddings || !response.embeddings[0]?.values) {
                throw new Error('No embeddings returned from API');
            }
            return response.embeddings[0].values;
        } catch (error) {
            console.error('Error generating embedding:', error);
            return new Array(768).fill(0); // Fallback to zero vector on error to prevent crash
        }
    }

    // 2. Compute Similarity (Already existed, kept as is)
    computeSimilarity(vecA: number[], vecB: number[]): number {
        if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            const valA = vecA[i] ?? 0;
            const valB = vecB[i] ?? 0;

            dotProduct += valA * valB;
            normA += valA * valA;
            normB += valB * valB;
        }

        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }

    // AI Semantic Intent Parsing (Replaces RegEx!)
    private async extractQueryIntent(text: string) {
        if (!text || !text.trim()) {
            return { organ_type: null, blood_type: null, age: null, location_intent: null, locations: [] };
        }

        const prompt = `
            Analyze this medical matching search query: "${text}"
            Extract the information and return ONLY a valid JSON object. Do not include markdown formatting.
            Standardize blood types to formats like 'O+', 'AB-'. Standardize organs to Title Case ('Kidney', 'Liver').
            JSON structure:
            {
                "organ_type": "string or null",
                "blood_type": "string or null",
                "age": "number or null",
                "location_intent": "string or null (return 'strict' if they use words like 'must be in', 'only in'. Return 'preferred' if they use words like 'near', 'would be nice', 'in')",
                "locations": ["array of strings, extracting any city or state names mentioned"]
            }
        `;
        try {
            const result = await this.genAI.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            const responseText = result.text || '{}';
            const match = responseText.match(/\{[\s\S]*\}/);
            if (match) return JSON.parse(match[0]);
        } catch (error) {
            console.error('AI Extraction Error:', error);
        }
        return { organ_type: null, blood_type: null, age: null, location_intent: null, locations: [] };
    }

    // 3. Extract Key Info (Helper for text analysis)
    private extractKeyInfo(text: string) {
        const lower = text.toLowerCase();

        // Extract Blood Type
        let blood_type: string | null = null;
        const bloodMatch = text.match(/blood type\s*([ABO][+-]?|AB[+-]?)/i);
        if (bloodMatch && bloodMatch[1]) {
            blood_type = bloodMatch[1].toUpperCase();
            if (!blood_type.includes('+') && !blood_type.includes('-')) blood_type += '+';
        }

        // Extract Organ Type
        let organ_type: string | null = null;
        if (lower.includes('kidney')) organ_type = 'Kidney';
        else if (lower.includes('pancreas')) organ_type = 'Pancreas';
        else if (lower.includes('liver')) organ_type = 'Liver';
        else if (lower.includes('heart')) organ_type = 'Heart';
        else if (lower.includes('lung')) organ_type = 'Lung';

        // Extract Age
        let age: number | null = null;
        const ageMatch = text.match(/age\s*(\d+)/i);
        if (ageMatch && ageMatch[1]) age = parseInt(ageMatch[1]);

        return { blood_type, organ_type, age };
    }

    // 4. Generate Match Reason (Updated to use BaseProfile snake_case)
    private generateMatchReason(profile: BaseProfile, aiFilters: any): string {
        const reasons: string[] = [];
        if (aiFilters.organ_type && profile.organ_type === aiFilters.organ_type)
            reasons.push(`${profile.organ_type} match`);
        if (aiFilters.blood_type && profile.blood_type === aiFilters.blood_type)
            reasons.push(`Blood type ${profile.blood_type} compatible`);
        if (aiFilters.age && profile.age && Math.abs(aiFilters.age - profile.age) <= 20)
            reasons.push('Age compatible');

        return reasons.length > 0 ? reasons.slice(0, 3).join(' • ') : 'Medical match';
    }

    /**
     * MAIN SEARCH FUNCTION
     * Now integrates AI Similarity + Database Fields (Hybrid Search)
     */
    async searchRealProfiles(
        searchCriteria: string,
        targetType: 'patient' | 'donor',
        excludeUserId?: number,
        maxResults: number = 10,
        minScore: number = 50,
        ignoreConflict: boolean = false
    ): Promise<{
        matches?: MatchResult[],
        conflict?: boolean,
        queried?: string,
        actual?: string
    }> {
        const { ProfileService } = await import('../services/profile.service');
        const profiles = ProfileService.getAllCompleteProfiles(targetType, excludeUserId);

        if (profiles.length === 0) return { matches: [] };

        // Fetch Searcher's Location for comparison
        let searcherLocation: { country: string, state: string } | undefined;
        let searcherOrgan: string | null = null;
        let searcherBlood: string | null = null;
        let searcherAge: number | null = null;

        if (excludeUserId) {
            // Determine the searcher's role (opposite of what they are looking for)
            const searcherRole = targetType === 'patient' ? 'donor' : 'patient';
            const myProfile = ProfileService.getUserProfile(excludeUserId, searcherRole);
            if (myProfile) {
                searcherLocation = {
                    country: myProfile.country || '',
                    state: myProfile.state || ''
                };
                searcherOrgan = myProfile.organ_type;
                searcherBlood = myProfile.blood_type;
                searcherAge = myProfile.age;
            }
        }

        // B. Generate Embedding for the Search Query
        const queryEmbedding = await this.generateEmbedding(searchCriteria);

        // Use AI Intent Parser!
        const aiIntent = await this.extractQueryIntent(searchCriteria);

        //  Organ Conflict Detection
        if (aiIntent.organ_type && searcherOrgan && !ignoreConflict) {
            if (aiIntent.organ_type.toLowerCase() !== searcherOrgan.toLowerCase()) {
                // Instantly halt and ask the user what to do!
                return { conflict: true, queried: aiIntent.organ_type, actual: searcherOrgan };
            }
        }

        const activeFilters = {
            organ_type: aiIntent.organ_type || searcherOrgan,
            blood_type: aiIntent.blood_type || searcherBlood,
            age: aiIntent.age || searcherAge
        };

        const matches: MatchResult[] = [];

        // D. Iterate and Score
        for (const profile of profiles) {
            // Hard Filter: Organ Type must match if specified
            if (activeFilters.organ_type && profile.organ_type &&
                activeFilters.organ_type.toLowerCase() !== profile.organ_type.toLowerCase()) {
                continue;
            }

            // Strict Geographic Requirement
            if (aiIntent.location_intent === 'strict' && aiIntent.locations.length > 0) {
                const profileLoc = `${profile.city} ${profile.state} ${profile.country}`.toLowerCase();
                const matchesLoc = aiIntent.locations.some((loc: string) => profileLoc.includes(loc.toLowerCase()));
                if (!matchesLoc) continue; // Instantly skip if they aren't in the strict area!
            }

            // 1. AI Similarity
            // Note: In production, profile embeddings should be cached in DB
            const profileText = `${profile.description} ${profile.medical_info} ${profile.organ_type} ${profile.preferences}`;
            const profileEmbedding = await this.generateEmbedding(profileText);
            const aiSimilarity = this.computeSimilarity(queryEmbedding, profileEmbedding);

            // 2. Calculate Hybrid Score
            const { hybridScore, breakdown } = this.calculateHybridScore(profile, activeFilters, aiSimilarity, searcherLocation, aiIntent, targetType);

            if ((hybridScore * 100) >= minScore) {
                matches.push({
                    profileId: profile.id,
                    profile: profile,
                    similarity: hybridScore,
                    rank: 0,
                    reason: this.generateMatchReason(profile, searchCriteria),
                    hybridScore,
                    scoreBreakdown: breakdown
                });
            }
        }

        return {
            matches: matches
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, maxResults)
                .map((m, i) => ({ ...m, rank: i + 1 }))
        }
    }

    /**
     * Hybrid Score Logic
     * Weights: AI (30%) + Blood (30%) + Location (20%) + Age (20%)
     */
    private calculateHybridScore(
        profile: BaseProfile,
        filters: { organ_type: string | null, blood_type: string | null; age: number | null },
        aiSimilarity: number,
        searcherLocation?: { country: string, state: string },
        aiIntent?: any,
        targetType?: 'patient' | 'donor'
    ) {
        let score = 0;

        // AI Score (0-30 points)
        score += Math.min(aiSimilarity * 100 * 0.2, 20);

        // Organ match score
        let organScore = 0;
        if (filters.organ_type?.toLowerCase() === profile.organ_type.toLowerCase()) {
            organScore = 30;
        }
        score += organScore;

        // Blood Type Score (0-30 points)
        let bloodScore = 0;
        if (filters.blood_type && profile.blood_type) {
            let isComp = false;

            // If the profile we are checking is a DONOR, they are giving to the searcher (PATIENT)
            if (targetType === 'donor') {
                isComp = this.isBloodCompatible(profile.blood_type, filters.blood_type);
            }
            // If the profile we are checking is a PATIENT, the searcher (DONOR) is giving to them
            else {
                isComp = this.isBloodCompatible(filters.blood_type, profile.blood_type);
            }

            if (profile.blood_type === filters.blood_type) bloodScore = 30; // Exact match
            else if (isComp) bloodScore = 20; // Compatible match
            else bloodScore = 5; // Incompatible
        } else if (profile.blood_type) {
            bloodScore = 5; // bloodScore = 5 encourage user to complete it's profile even not match
        }
        score += bloodScore;

        //  Age Score (0-20 points)
        let ageScore = 0;
        if (filters.age && profile.age) {
            const diff = Math.abs(profile.age - filters.age);
            if (diff <= 5) ageScore = 10;
            else if (diff <= 15) ageScore = 8;
            else ageScore = 3;
        } else if (profile.age) {
            ageScore = 3;
        }
        score += ageScore;

        // Location Score (5 / 10 / 20 points)
        let locationScore = 0; // Default: Different country / Unknown

        // 🚀 SMART FILTER: Soft Geogrpahic Boost
        if (aiIntent?.location_intent === 'preferred' && aiIntent.locations.length > 0) {
            const profileLoc = `${profile.city} ${profile.state} ${profile.country}`.toLowerCase();
            const matchesLoc = aiIntent.locations.some((loc: string) => profileLoc.includes(loc.toLowerCase()));
            if (matchesLoc) locationScore = 10; // Extra points for matching the soft preference!
        } else if (searcherLocation && profile.country) {
            // Standard location matching fallback
            const pCountry = profile.country.trim().toLowerCase();
            const sCountry = searcherLocation.country.trim().toLowerCase();
            if (pCountry && pCountry === sCountry) {
                locationScore = 7;
                if (profile.state && searcherLocation.state && profile.state.trim().toLowerCase() === searcherLocation.state.trim().toLowerCase()) {
                    locationScore = 10;
                }
            } else if (pCountry) {
                locationScore = 3;
            }
        }
        score += locationScore;

        const total = Math.min(score, 100);

        return {
            hybridScore: total / 100,
            breakdown: {
                aiSimilarity: aiSimilarity * 100 * 0.2,
                bloodTypeScore: bloodScore,
                ageScore: ageScore,
                locationScore: locationScore,
                organScore: organScore
            }
        };
    }

    // Helper for blood compatibility
    private isBloodCompatible(donor: string, recipient: string): boolean {
        // Strip out any weird spaces and ensure uppercase just in case
        const d = donor.replace(/\s/g, '').toUpperCase();
        const r = recipient.replace(/\s/g, '').toUpperCase();

        const compatibilityChart: Record<string, string[]> = {
            'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Universal Donor
            'O+': ['O+', 'A+', 'B+', 'AB+'],
            'A-': ['A-', 'A+', 'AB-', 'AB+'],
            'A+': ['A+', 'AB+'],
            'B-': ['B-', 'B+', 'AB-', 'AB+'],
            'B+': ['B+', 'AB+'],
            'AB-': ['AB-', 'AB+'],
            'AB+': ['AB+'] // Universal Recipient
        };

        // Check if the recipient is in the donor's "approved to give to" list
        return compatibilityChart[d]?.includes(r) || false;
    }

    // Background Match Scanner (Simplified)
    async checkAndSendMatchAlerts(userId: number, userRole: 'patient' | 'donor') {
        console.log(`\n🔄 [Auto-Match] Waking up scanner for User ${userId} (${userRole})...`);
        const { ProfileService } = await import('../services/profile.service');
        const { NotificationService } = await import('../services/notification.service');
        const db = (await import('../database/init')).default;

        // 1. Get current user profile to use as search query
        const myProfile = ProfileService.getUserProfile(userId, userRole);
        if (!myProfile) {
            console.log(`⚠️ [Auto-Match] Aborted: Could not find profile for User ${userId}`);
            return;
        }

        // 2. Search for opposite role
        const targetType = userRole === 'patient' ? 'donor' : 'patient';

        // 3. Use my profile description as the search criteria
        const searchCriteria = `Blood type ${myProfile.blood_type} Age ${myProfile.age} Organ ${myProfile.organ_type}. ${myProfile.description}`;

        // Pass true to ignore conflicts during background scans
        const result = await this.searchRealProfiles(searchCriteria, targetType, userId, 5, 80, true);
        const matches = result.matches || [];

        if (matches.length > 0) {
            // Send real-time system notifications [Restored Logic]
            for (const match of matches) {
                // Look up the numeric user_id of the matched profile
                const stmt = db.prepare('SELECT user_id FROM profiles WHERE id = ?');
                const recipient = stmt.get(match.profileId) as any;

                if (recipient && recipient.user_id) {
                    // Alert the person who was matched WITH
                    NotificationService.createNotification(
                        recipient.user_id,
                        '🚨 High Compatibility Match Alert!',
                        `Great news! A new ${userRole} with a ${Math.round(match.similarity * 100)}% compatibility score just registered on the platform. Check your Match tab to view their details!`,
                        'system'
                    );
                    console.log(`📬 [Auto-Match] Real-time alert sent to matched User ${recipient.user_id}!`);
                }
            }
        } else {
            console.log(`💨 [Auto-Match] Finished: No matches above 80% found right now.`);
        }
    }
}