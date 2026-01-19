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
        const { profileId, profileText, topN = 5, minSimilarity = 0.5 } = request;

        // Get query embedding
        let queryEmbedding: number[];

        if (profileText) {
            queryEmbedding = await this.generateEmbedding(profileText);
        } else if (profileId) {
            const embData = this.embeddings.get(profileId);

            if (!embData) {
                throw new Error(`Profile ${profileId} not found in embeddings`);
            }

            queryEmbedding = embData.embedding;
        } else {
            throw new Error('Either profileId or profileText must be provided');
        }

        // Calculate similarities
        const matches: MatchResult[] = [];

        for (const [id, embData] of this.embeddings.entries()) {
            // Skip self-matching
            if (id === profileId) continue;

            const profile = this.profiles.get(id);
            if (!profile) continue;

            const similarity = this.computeSimilarity(queryEmbedding, embData.embedding);

            if (similarity >= minSimilarity) {
                matches.push({
                    profileId: id,
                    profile,
                    similarity,
                    rank: 0 // Will be set after sorting
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
}