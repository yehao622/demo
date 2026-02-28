import { GoogleGenAI } from '@google/genai';
import { BaseProfile } from '../models/profile.model'; // Unified Type
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
    private generateMatchReason(profile: BaseProfile, queryText: string): string {
        const reasons: string[] = [];
        const queryInfo = this.extractKeyInfo(queryText);

        if (queryInfo.organ_type && profile.organ_type === queryInfo.organ_type) {
            reasons.push(`${profile.organ_type} match`);
        }
        if (queryInfo.blood_type && profile.blood_type === queryInfo.blood_type) {
            reasons.push(`Blood type ${profile.blood_type} compatible`);
        }
        if (queryInfo.age && profile.age) {
            if (Math.abs(queryInfo.age - profile.age) <= 20) reasons.push('Age compatible');
        }

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
        minScore: number = 50
    ): Promise<MatchResult[]> {
        // A. Load Profiles (Directly as BaseProfile, no conversion needed!)
        const { ProfileService } = await import('../services/profile.service');
        const profiles = ProfileService.getAllCompleteProfiles(targetType, excludeUserId);

        if (profiles.length === 0) return [];

        // Fetch Searcher's Location for comparison
        let searcherLocation: { country: string, state: string } | undefined;
        if (excludeUserId) {
            // Determine the searcher's role (opposite of what they are looking for)
            const searcherRole = targetType === 'patient' ? 'donor' : 'patient';
            const myProfile = ProfileService.getUserProfile(excludeUserId, searcherRole);
            if (myProfile) {
                searcherLocation = {
                    country: myProfile.country || '',
                    state: myProfile.state || ''
                };
            }
        }

        // B. Generate Embedding for the Search Query
        const queryEmbedding = await this.generateEmbedding(searchCriteria);

        // C. Parse text filters (e.g. "Type O+ Kidney")
        const textFilters = this.extractKeyInfo(searchCriteria);

        const matches: MatchResult[] = [];

        // D. Iterate and Score
        for (const profile of profiles) {
            // Hard Filter: Organ Type must match if specified
            if (textFilters.organ_type && profile.organ_type &&
                textFilters.organ_type.toLowerCase() !== profile.organ_type.toLowerCase()) {
                continue;
            }

            // 1. AI Similarity
            // Note: In production, profile embeddings should be cached in DB
            const profileText = `${profile.description} ${profile.medical_info} ${profile.organ_type} ${profile.preferences}`;
            const profileEmbedding = await this.generateEmbedding(profileText);
            const aiSimilarity = this.computeSimilarity(queryEmbedding, profileEmbedding);

            // 2. Calculate Hybrid Score
            const { hybridScore, breakdown } = this.calculateHybridScore(profile, textFilters, aiSimilarity, searcherLocation);

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

        return matches
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, maxResults)
            .map((m, i) => ({ ...m, rank: i + 1 }));
    }

    /**
     * Hybrid Score Logic
     * Weights: AI (30%) + Blood (30%) + Location (20%) + Age (20%)
     */
    private calculateHybridScore(
        profile: BaseProfile,
        filters: { organ_type: string | null, blood_type: string | null; age: number | null },
        aiSimilarity: number,
        searcherLocation?: { country: string, state: string }
    ) {
        let score = 0;

        // AI Score (0-30 points)
        score += aiSimilarity * 20;

        // Organ match score
        let organScore = 0;
        if (filters.organ_type?.toLowerCase() === profile.organ_type.toLowerCase()) {
            organScore = 30;
        }
        score += organScore;

        // Blood Type Score (0-30 points)
        let bloodScore = 0;
        if (filters.blood_type && profile.blood_type) {
            if (profile.blood_type === filters.blood_type) bloodScore = 30;
            else if (this.isBloodCompatible(profile.blood_type, filters.blood_type)) bloodScore = 20;
        } else {
            bloodScore = 15;
        }
        score += bloodScore;

        //  Age Score (0-20 points)
        let ageScore = 0;
        if (filters.age && profile.age) {
            const diff = Math.abs(profile.age - filters.age);
            if (diff <= 5) ageScore = 20;
            else if (diff <= 15) ageScore = 10;
        } else {
            ageScore = 10;
        }
        score += ageScore;

        // Location Score (5 / 10 / 20 points)
        let locationScore = 10; // Default: Different country / Unknown

        if (searcherLocation && profile.country) {
            const pCountry = profile.country.trim().toLowerCase();
            const sCountry = searcherLocation.country.trim().toLowerCase();

            if (pCountry === sCountry) {
                // Same Country - check State
                locationScore = 20;

                if (profile.state && searcherLocation.state) {
                    const pState = profile.state.trim().toLowerCase();
                    const sState = searcherLocation.state.trim().toLowerCase();

                    if (pState === sState) {
                        locationScore = 40; // Same Province/State
                    }
                }
            }
        }
        score += locationScore;

        const total = Math.min(score, 100);

        return {
            hybridScore: total / 100,
            breakdown: {
                aiSimilarity: aiSimilarity * 100,
                bloodTypeScore: bloodScore,
                ageScore: ageScore,
                locationScore: locationScore,
                organScore: organScore
            }
        };
    }

    // Helper for blood compatibility
    private isBloodCompatible(donor: string, recipient: string): boolean {
        // Simplified logic: Exact match or O- donor / AB+ recipient
        if (donor === 'O-') return true;
        if (recipient === 'AB+') return true;
        return donor === recipient;
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

        const matches = await this.searchRealProfiles(searchCriteria, targetType, userId, 5, 80);

        if (matches.length > 0) {
            console.log(`✅ [Auto-Match] Found ${matches.length} matches for User ${userId}`);
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

            // Also alert the current user (the one who just saved their profile)
            // NotificationService.createNotification(
            //     userId,
            //     '🚨 High Compatibility Match Found!',
            //     `Great news! We found ${matches.length} highly compatible ${targetType}(s) for you. Check your Match tab!`,
            //     'system'
            // );
        } else {
            console.log(`💨 [Auto-Match] Finished: No matches above 80% found right now.`);
        }
    }
}