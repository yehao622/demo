export interface Profile {
    id: string;
    name: string;
    type: 'patient' | 'donor';
    description: string;
    medicalInfo: string;
    preferences?: string;
    bloodType?: string;
    age?: number;
    country?: string;
    state?: string;
    city?: string;
    organType?: string;
}

export interface ProfileEmbedding {
    profileId: string;
    embedding: number[];
    timestamp: Date;
}

export interface MatchResult {
    profileId: string;
    profile: Profile;
    similarity: number;
    rank: number;
    reason?: string;
    hybridScore?: number;
    scoreBreakdown?: {
        aiSimilarity: number;         // 0-1
        bloodTypeScore: number;       // 0-1
        locationScore: number;        // 0-1
        ageScore: number;             // 0-1
    };
}

export interface MatchRequest {
    profileId?: string;
    profileText?: string;
    topN: number;
    minSimilarity?: number;
    searcherType?: 'patient' | 'donor';
}

export interface ProfileFormData {
    name: string;
    type: 'patient' | 'donor';
    description: string;
    medicalInfo: string;
    preferences: string;
}
