import { GoogleGenAI } from '@google/genai';
import { Profile, ProfileEmbedding, MatchResult, MatchRequest } from './matching.types';

export class MatchingService {
    private genAI: GoogleGenAI;
    private embeddingModel: string = 'gemini-embedding-001';
    // In-memory storage (replace with PostgreSQL in production)
    // private embeddings: Map<string, ProfileEmbedding> = new Map();
    // private profiles: Map<string, Profile> = new Map();

    // ONLY keep temporary cache for current search session
    private searchCache: Map<string, number[]> = new Map();

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY not found in environment variables');
        }
        this.genAI = new GoogleGenAI({ apiKey });
    }

    // Generate embedding vector for profile text
    async generateEmbedding(text: string): Promise<number[]> {
        try {
            const response = await this.genAI.models.embedContent({
                model: this.embeddingModel,
                contents: text,
            });

            // Type-safe access with validation
            if (!response.embeddings || response.embeddings.length === 0) {
                throw new Error('No embeddings returned from API');
            }

            const embedding = response.embeddings[0];

            // Check if embedding exists and has values
            if (!embedding) {
                throw new Error('Embedding object is undefined');
            }

            if (!embedding.values || embedding.values.length === 0) {
                throw new Error('Empty embedding values returned');
            }

            // Now TypeScript knows this is definitely number[]
            return embedding.values;
        } catch (error) {
            console.error('Error generating embedding:', error);
            throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Generate embeddings for multiple texts (batch processing)
     */
    async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
        try {
            const response = await this.genAI.models.embedContent({
                model: this.embeddingModel,
                contents: texts,
            });

            // Type-safe access with validation
            if (!response.embeddings || response.embeddings.length === 0) {
                throw new Error('No embeddings returned from API');
            }

            // Map and validate each embedding
            const embeddings: number[][] = [];

            for (let index = 0; index < response.embeddings.length; index++) {
                const emb = response.embeddings[index];

                if (!emb) {
                    throw new Error(`Embedding at index ${index} is undefined`);
                }

                if (!emb.values || emb.values.length === 0) {
                    throw new Error(`Empty embedding values at index ${index}`);
                }

                embeddings.push(emb.values);
            }

            return embeddings;
        } catch (error) {
            console.error('Error generating batch embeddings:', error);
            throw new Error(`Failed to generate batch embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Compute cosine similarity between two vectors
     */
    computeSimilarity(vecA: number[], vecB: number[]): number {
        if (!vecA || !vecB) {
            throw new Error('Invalid vectors: vectors cannot be null or undefined');
        }

        if (vecA.length !== vecB.length) {
            throw new Error(`Vector dimension mismatch: ${vecA.length} vs ${vecB.length}`);
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            const a = vecA[i];
            const b = vecB[i];

            // Additional safety check
            if (a === undefined || b === undefined) {
                throw new Error(`Undefined value at index ${i}`);
            }

            dotProduct += a * b;
            normA += a * a;
            normB += b * b;
        }

        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }


    private extractKeyInfo(text: string): {
        bloodType: string | null;
        organType: string | null;
        age: number | null;
    } {
        const lower = text.toLowerCase();

        // Blood type extraction
        let bloodType: string | null = null;
        const bloodMatch = text.match(/blood type\s*([ABO][+-]?|AB[+-]?)/i);
        if (bloodMatch && bloodMatch[1]) {
            bloodType = bloodMatch[1].toUpperCase();
            // Normalize format
            if (!bloodType.includes('+') && !bloodType.includes('-')) {
                bloodType += '+'; // Default to positive if not specified
            }
        }

        // Organ type extraction
        let organType: string | null = null;
        if (lower.includes('kidney') || lower.includes('kidneys')) organType = 'Kidney';
        else if (lower.includes('pancreas')) organType = 'Pancreas';
        else if (lower.includes('liver')) organType = 'Liver';
        else if (lower.includes('heart')) organType = 'Heart';
        else if (lower.includes('lung') || lower.includes('lungs')) organType = 'Lung';
        else if (lower.includes('intestine') || lower.includes('intestines')) organType = 'Intestine';
        else if (lower.includes('marrow') || lower.includes('bone marrow')) organType = 'Marrow';

        // Age extraction
        let age: number | null = null;
        const ageMatch = text.match(/age\s*(\d+)/i);
        if (ageMatch && ageMatch[1]) age = parseInt(ageMatch[1]);

        return { bloodType, organType, age };
    }

    // Add this method to generate simple match reasons
    private generateMatchReason(profile: Profile, queryText: string): string {
        const reasons: string[] = [];
        const profileInfo = this.extractKeyInfo(profile.medicalInfo + ' ' + profile.description);
        const queryInfo = this.extractKeyInfo(queryText);

        // Organ match
        if (queryInfo.organType && profileInfo.organType === queryInfo.organType) {
            reasons.push(`${profileInfo.organType} match`);
        }

        // Blood type match
        if (queryInfo.bloodType && profileInfo.bloodType === queryInfo.bloodType) {
            reasons.push(`Blood type ${profileInfo.bloodType} compatible`);
        }

        // Age compatibility (within 20 years)
        if (queryInfo.age && profileInfo.age) {
            const ageDiff = Math.abs(queryInfo.age - profileInfo.age);
            if (ageDiff <= 20) {
                reasons.push('Age compatible');
            }
        }

        // Health/lifestyle indicators
        const profileLower = (profile.medicalInfo + ' ' + (profile.preferences || '')).toLowerCase();
        if (profileLower.includes('non-smoker') || profileLower.includes('non smoker')) {
            reasons.push('Non-smoker');
        }
        if (profileLower.includes('healthy') || profileLower.includes('excellent health')) {
            reasons.push('Healthy lifestyle');
        }
        if (profileLower.includes('willing to travel') || profileLower.includes('travel')) {
            reasons.push('Willing to travel');
        }

        // Default if no specific reasons
        if (reasons.length === 0) {
            reasons.push('Medical profile matches criteria');
        }

        // Return up to 4 reasons
        return reasons.slice(0, 4).join(' • ');
    }

    /**
     * Build searchable text from profile
     */
    private buildProfileText(profile: Profile): string {
        return `
      Type: ${profile.type}
      Name: ${profile.name}
      Description: ${profile.description}
      Medical Info: ${profile.medicalInfo}
      ${profile.preferences ? `Preferences: ${profile.preferences}` : ''}
    `.trim();
    }

    // Convert ProfileData (from database) to Profile (matching format)
    private convertProfileDataToProfile(data: any): Profile {
        return {
            id: data.id,
            name: data.name,
            type: data.type,
            bloodType: data.blood_type || 'Not specified',
            age: data.age,
            country: data.country,
            state: data.state,
            city: data.city,
            organType: data.organ_type || 'Not specified',
            description: data.description || 'No description provided',
            medicalInfo: data.medical_info || '',
            preferences: data.preferences || ''
        };
    }

    /**
     * Load real user profiles from database and store with embeddings
     * @param targetType - Type of profiles to load ('patient' or 'donor')
     * @param excludeUserId - User ID to exclude from results (current user)
     */
    async loadRealUserProfiles(
        targetType: 'patient' | 'donor',
        excludeUserId?: number
    ): Promise<Profile[]> {
        try {
            // Import ProfileService dynamically to avoid circular dependency
            const { ProfileService } = await import('../services/profile.service');

            // Fetch complete profiles from database
            const profilesData = ProfileService.getAllCompleteProfiles(targetType, excludeUserId);

            if (profilesData.length === 0) {
                console.log(`No complete ${targetType} profiles found in database`);
                return [];
            }

            // Convert to Profile format
            const profiles: Profile[] = profilesData.map(data =>
                this.convertProfileDataToProfile(data)
            );

            // Store profiles with embeddings in batch
            // await this.storeProfilesBatch(profiles);

            console.log(`✓ Loaded ${profiles.length} real ${targetType} profiles from database`);
            return profiles;
        } catch (error) {
            console.error('Error loading real user profiles:', error);
            throw error;
        }
    }

    /**
 * Search real profiles with AI matching
 * @param searchCriteria - Natural language search query
 * @param targetType - Type of profiles to search ('patient' or 'donor')
 * @param excludeUserId - User ID to exclude from results
 * @param maxResults - Maximum number of results to return
 * @param minScore - Minimum similarity score (0-100)
 */
    async searchRealProfiles(
        searchCriteria: string,
        targetType: 'patient' | 'donor',
        excludeUserId?: number,
        maxResults: number = 10,
        minScore: number = 50
    ): Promise<MatchResult[]> {
        console.log(`🔍 Search: "${searchCriteria}" for ${targetType}s`);

        // 1. Load public profiles we are searching against
        const profiles = await this.loadRealUserProfiles(targetType, excludeUserId);

        if (profiles.length === 0) {
            console.log('⚠️  No profiles available for search');
            return [];
        }

        // 2. Extract any specific filters the user typed in the search box
        const queryInfo = this.extractKeyInfo(searchCriteria);
        const queryProfileData: Partial<Profile> = {};

        if (queryInfo.bloodType) queryProfileData.bloodType = queryInfo.bloodType;
        if (queryInfo.age !== null) queryProfileData.age = queryInfo.age;
        if (queryInfo.organType) queryProfileData.organType = queryInfo.organType;

        // 3. --- FIX: FETCH THE LOGGED-IN USER'S DB PROFILE ---
        const { ProfileService } = await import('../services/profile.service');
        const searcherType = targetType === 'patient' ? 'donor' : 'patient';
        let currentSearcherProfile = null;

        if (excludeUserId) {
            // Fetch the user's actual saved data (B+, MA, Heart, etc.)
            const dbProfile = ProfileService.getUserProfile(excludeUserId, searcherType);
            if (dbProfile) {
                currentSearcherProfile = this.convertProfileDataToProfile(dbProfile);
            }
        }

        // 4. Merge the Database Profile with the Search Text Overrides
        // (If they type a different organ, it overrides their DB organ for this search)
        const finalSearcherProfile = {
            ...(currentSearcherProfile || {}),
            ...queryProfileData
        } as Profile;


        // 5. Calculate similarities
        const matches: MatchResult[] = [];

        for (let i = 0; i < profiles.length; i++) {
            const profile = profiles[i];
            if (!profile) continue;

            // HARD FILTER - Organ type MUST match
            const queryOrganType = finalSearcherProfile.organType;
            if (queryOrganType && profile.organType) {
                if (queryOrganType.toLowerCase() !== profile.organType.toLowerCase()) {
                    continue; // Skip this profile if organs don't match
                }
            }

            // Calculate hybrid score using the FULL profile (DB + Text)
            const { hybridScore, breakdown } = this.calculateHybridScore(
                targetType === 'donor' ? profile : finalSearcherProfile,
                targetType === 'donor' ? finalSearcherProfile : profile
            );

            const scorePercentage = Math.round(hybridScore * 100);

            if (scorePercentage >= minScore) {
                // Generate a reason for the UI based on what actually matched
                const reason = this.generateMatchReason(profile, searchCriteria);

                matches.push({
                    profileId: profile.id,
                    profile,
                    similarity: hybridScore,
                    rank: 0,
                    reason,
                    hybridScore,
                    scoreBreakdown: breakdown
                });
            }
        }

        // Sort by similarity (highest score first)
        matches.sort((a, b) => b.similarity - a.similarity);
        matches.forEach((match, index) => {
            match.rank = index + 1;
        });

        console.log(`✅ Found ${matches.length} matches above ${minScore}% similarity`);

        return matches.slice(0, maxResults);
    }

    /**
     * Blood type compatibility matrix
     * Returns compatibility score (0-1)
     */
    private calculateBloodTypeCompatibility(donorBlood: string | undefined, recipientBlood: string | undefined): number {
        if (!donorBlood || !recipientBlood) return 0.5;

        const donor = donorBlood.toUpperCase();
        const recipient = recipientBlood.toUpperCase();

        if (donor === recipient) return 1.0; // Matched perfectly
        if (donor === 'O-') return 0.99; // universal donor blood type
        if (recipient === 'AB+') return 0.99; // universal recipient blood type

        // Compatibility matrix blood types
        const compatibilityMap: { [key: string]: string[] } = {
            'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
            'O+': ['O+', 'A+', 'B+', 'AB+'],
            'A-': ['A-', 'A+', 'AB-', 'AB+'],
            'A+': ['A+', 'AB+'],
            'B-': ['B-', 'B+', 'AB-', 'AB+'],
            'B+': ['B+', 'AB+'],
            'AB-': ['AB-', 'AB+'],
            'AB+': ['AB+']
        };

        const compatibleRecipients = compatibilityMap[donor] || [];
        return compatibleRecipients.includes(recipient) ? 0.8 : 0.2;
    }

    /**
     * Location proximity scoring
     * Returns score (0-1) based on geographic distance
     */
    private calculateLocationScore(
        profile1: { country?: string; state?: string; city?: string },
        profile2: { country?: string; state?: string; city?: string }
    ): number {
        if (!profile1.country || !profile2.country) return 0.5; // Neutral if unknown

        // Same city = 1.0
        if (profile1.city && profile2.city &&
            profile1.city.toLowerCase() === profile2.city.toLowerCase()) {
            return 1.0;
        }

        // Same state = 0.8
        if (profile1.state && profile2.state &&
            profile1.state.toLowerCase() === profile2.state.toLowerCase()) {
            return 0.8;
        }

        // Same country = 0.4
        if (profile1.country.toLowerCase() === profile2.country.toLowerCase()) {
            return 0.4;
        }

        // Different country
        return 0.1;
    }

    /**
     * Age compatibility scoring
     * Returns score (0-1) based on age difference
     */
    private calculateAgeScore(age1: number | undefined, age2: number | undefined): number {
        if (!age1 || !age2) return 0.5; // Neutral if unknown

        const ageDiff = Math.abs(age1 - age2);

        // Perfect match (within 5 years)
        if (ageDiff <= 5) return 1.0;

        // Good match (within 10 years)
        if (ageDiff <= 10) return 0.9;

        // Acceptable (within 20 years)
        if (ageDiff <= 20) return 0.7;

        // Marginal (within 30 years)
        if (ageDiff <= 30) return 0.5;

        // Poor match (more than 30 years)
        return 0.3;
    }

    /**
     * Calculate hybrid match score
     * Combines AI similarity with medical/geographic factors
     */
    private calculateHybridScore(
        donorProfile: Profile,
        patientProfile: Profile
    ): {
        hybridScore: number;
        breakdown: any;
    } {
        let score = 0;

        // 1. BASE SCORE (50 points)
        // Note: The loop in searchRealProfiles already filters out mismatched organs, 
        // so if they make it to this function, they get the base 50 points.
        score += 50;

        // 2. BLOOD TYPE SCORE (15 / 1 / 0 points)
        let bloodTypePoints = 0;

        // Check if either profile is missing blood type
        if (!donorProfile.bloodType || donorProfile.bloodType === 'Not specified' ||
            !patientProfile.bloodType || patientProfile.bloodType === 'Not specified') {
            bloodTypePoints = 0;
        } else {
            // Reuse your existing compatibility function!
            const compatScore = this.calculateBloodTypeCompatibility(donorProfile.bloodType, patientProfile.bloodType);

            if (compatScore >= 0.8) {
                bloodTypePoints = 15; // Compatible (1.0, 0.99, 0.8)
            } else {
                bloodTypePoints = 1;  // Both filled it out, but incompatible (0.2)
            }
        }
        score += bloodTypePoints;

        // 3. LOCATION SCORE (Bonus points up to 10)
        let locationPoints = 0;
        if (donorProfile.state && patientProfile.state &&
            donorProfile.state.toLowerCase() === patientProfile.state.toLowerCase()) {
            locationPoints += 10;
        } else if (donorProfile.country && patientProfile.country &&
            donorProfile.country.toLowerCase() === patientProfile.country.toLowerCase()) {
            locationPoints += 5;
        }
        score += locationPoints;

        // 4. Cap at 100, and convert to decimal (e.g., 65 -> 0.65) for the frontend
        const finalPercentage = Math.min(score, 100);
        const hybridScore = finalPercentage / 100;

        return {
            hybridScore,
            breakdown: {
                baseScore: 50,
                bloodTypeScore: bloodTypePoints,
                locationScore: locationPoints
            }
        };
    }
}