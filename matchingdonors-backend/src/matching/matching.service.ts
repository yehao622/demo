import { GoogleGenAI } from '@google/genai';
import { Profile, ProfileEmbedding, MatchResult, MatchRequest } from './matching.types';

export class MatchingService {
    private genAI: GoogleGenAI;
    private embeddingModel: string = 'gemini-embedding-001';
    // In-memory storage (replace with PostgreSQL in production)
    private embeddings: Map<string, ProfileEmbedding> = new Map();
    private profiles: Map<string, Profile> = new Map();

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

    /**
     * Store profile with its embedding
     */
    async storeProfile(profile: Profile): Promise<void> {
        try {
            const profileText = this.buildProfileText(profile);
            const embedding = await this.generateEmbedding(profileText);

            this.profiles.set(profile.id, profile);
            this.embeddings.set(profile.id, {
                profileId: profile.id,
                embedding,
                timestamp: new Date()
            });

            console.log(`✓ Stored profile ${profile.id} with embedding dimension: ${embedding.length}`);
        } catch (error) {
            console.error(`Failed to store profile ${profile.id}:`, error);
            throw error;
        }
    }

    /**
     * Store multiple profiles with embeddings (batch)
     */
    async storeProfilesBatch(profiles: Profile[]): Promise<void> {
        try {
            const profileTexts = profiles.map(p => this.buildProfileText(p));
            const embeddings = await this.generateEmbeddingsBatch(profileTexts);

            profiles.forEach((profile, index) => {
                const embedding = embeddings[index];

                if (!embedding) {
                    throw new Error(`Missing embedding for profile ${profile.id} at index ${index}`);
                }

                this.profiles.set(profile.id, profile);
                this.embeddings.set(profile.id, {
                    profileId: profile.id,
                    embedding,
                    timestamp: new Date()
                });
            });

            console.log(`✓ Stored ${profiles.length} profiles in batch`);
        } catch (error) {
            console.error('Failed to store profiles in batch:', error);
            throw error;
        }
    }

    /**
     * Find top N matching profiles
     */
    async findTopMatches(request: MatchRequest): Promise<MatchResult[]> {
        const { profileId, profileText, topN = 5, minSimilarity = 0.5, searcherType } = request;

        // Get query embedding
        let queryEmbedding: number[];
        let queryText = profileText || '';
        let queryProfile: Profile | undefined;

        if (profileText) {
            queryEmbedding = await this.generateEmbedding(profileText);
        } else if (profileId) {
            const embData = this.embeddings.get(profileId);

            if (!embData) {
                throw new Error(`Profile ${profileId} not found in embeddings`);
            }

            queryEmbedding = embData.embedding;
            queryProfile = this.profiles.get(profileId);
            if (queryProfile) {
                queryText = this.buildProfileText(queryProfile);
            }
        } else {
            throw new Error('Either profileId or profileText must be provided');
        }


        // Infer searcher type from query text if not provided
        let inferredSearcherType = searcherType;
        if (!inferredSearcherType && queryText) {
            const lower = queryText.toLowerCase();
            if (lower.includes('need') || lower.includes('seeking') || lower.includes('looking for') ||
                lower.includes('require') || lower.includes('patient')) {
                inferredSearcherType = 'patient';
            } else if (lower.includes('donate') || lower.includes('donor') || lower.includes('willing to give')) {
                inferredSearcherType = 'donor';
            }
        }

        // Extract query info for hybrid scoring
        const queryInfo = this.extractKeyInfo(queryText);
        const queryProfileData: Partial<Profile> = {};

        // Only assign properties if they have actual values (not undefined)
        const bloodType = queryInfo.bloodType || queryProfile?.bloodType;
        if (bloodType) {
            queryProfileData.bloodType = bloodType;
        }

        const age = queryInfo.age ?? queryProfile?.age;
        if (age !== null && age !== undefined) {
            queryProfileData.age = age;
        }

        if (queryProfile?.country) {
            queryProfileData.country = queryProfile.country;
        }

        if (queryProfile?.state) {
            queryProfileData.state = queryProfile.state;
        }

        if (queryProfile?.city) {
            queryProfileData.city = queryProfile.city;
        }

        const organType = queryInfo.organType || queryProfile?.organType;
        if (organType) {
            queryProfileData.organType = organType;
        }

        // Calculate similarities
        const matches: MatchResult[] = [];

        for (const [id, embData] of this.embeddings.entries()) {
            // Skip self-matching
            if (id === profileId) continue;

            const profile = this.profiles.get(id);
            if (!profile) continue;

            // If searcher is a patient, only show donors. If searcher is a donor, only show patients.
            if (inferredSearcherType) {
                if (inferredSearcherType === 'patient' && profile.type !== 'donor') continue;
                if (inferredSearcherType === 'donor' && profile.type !== 'patient') continue;
            }

            // HARD FILTER - Organ type must match if specified
            const queryOrganType = queryInfo.organType || queryProfile?.organType;
            if (queryOrganType && profile.organType) {
                // Both have organ types specified - they must match
                if (queryOrganType.toLowerCase() !== profile.organType.toLowerCase()) {
                    continue; // Skip this profile - organ doesn't match
                }
            }

            // AI similarity (cosine similarity)
            const aiSimilarity = this.computeSimilarity(queryEmbedding, embData.embedding);

            // Calculate hybrid score
            const { hybridScore, breakdown } = this.calculateHybridScore(
                aiSimilarity,
                inferredSearcherType === 'patient' ? profile : queryProfileData as Profile,
                inferredSearcherType === 'patient' ? queryProfileData as Profile : profile
            );

            if (hybridScore >= minSimilarity) {
                // Generate match reason
                const reason = this.generateMatchReason(profile, queryText);

                matches.push({
                    profileId: id,
                    profile,
                    similarity: hybridScore,
                    rank: 0, // Will be set after sorting
                    reason,
                    hybridScore,
                    scoreBreakdown: breakdown
                });
            }
        }

        // Sort by similarity (descending) and assign ranks
        matches.sort((a, b) => b.similarity - a.similarity);
        matches.forEach((match, index) => {
            match.rank = index + 1;
        });

        return matches.slice(0, topN);
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

    /**
     * Get all stored profiles (for testing)
     */
    getAllProfiles(): Profile[] {
        return Array.from(this.profiles.values());
    }

    /**
     * Get embedding statistics
     */
    getStats(): { profileCount: number; embeddingCount: number } {
        return {
            profileCount: this.profiles.size,
            embeddingCount: this.embeddings.size
        };
    }

    /**
     * Clear all stored data (for testing)
     */
    clearAll(): void {
        this.profiles.clear();
        this.embeddings.clear();
        console.log('✓ Cleared all profiles and embeddings');
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
        aiSimilarity: number,
        donorProfile: Profile,
        patientProfile: Profile
    ): {
        hybridScore: number;
        breakdown: {
            aiSimilarity: number;
            bloodTypeScore: number;
            locationScore: number;
            ageScore: number;
        }
    } {
        // Calculate individual scores
        const bloodTypeScore = this.calculateBloodTypeCompatibility(
            donorProfile.bloodType,
            patientProfile.bloodType
        );

        const locationScore = this.calculateLocationScore(
            donorProfile,
            patientProfile
        );

        const ageScore = this.calculateAgeScore(
            donorProfile.age,
            patientProfile.age
        );

        // Weighted combination (configurable)
        const weights = {
            ai: 0.2,           // 50% AI semantic similarity
            bloodType: 0.5,    // 25% Blood type compatibility
            location: 0.1,     // 1% Geographic proximity
            age: 0.2           // 15% Age compatibility
        };

        const hybridScore =
            weights.ai * aiSimilarity +
            weights.bloodType * bloodTypeScore +
            weights.location * locationScore +
            weights.age * ageScore;

        return {
            hybridScore,
            breakdown: {
                aiSimilarity,
                bloodTypeScore,
                locationScore,
                ageScore
            }
        };
    }


}