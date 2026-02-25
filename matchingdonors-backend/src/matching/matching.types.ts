import { BaseProfile } from "../models/profile.model";

export interface ProfileEmbedding {
    profileId: string;
    embedding: number[];
    timestamp: Date;
}

export interface MatchResult {
    profileId: string;
    profile: BaseProfile;
    similarity: number;
    rank: number;
    reason?: string;
    hybridScore?: number;
    scoreBreakdown?: {
        aiSimilarity: number;
        bloodTypeScore: number;
        locationScore: number;
        ageScore: number;
    };
}

export interface MatchRequest {
    profileId: string;
    profileText?: string;
    topN: number;
    minSimilarity?: number;
    searcherType?: 'patient' | 'donor';
}