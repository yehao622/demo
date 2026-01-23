export interface Profile {
    id: string;
    name: string;
    type: 'patient' | 'donor';
    description: string;
    medicalInfo: string;
    preferences?: string;
}

export interface MatchResult {
    profileId: string;
    profile: Profile;
    similarity: number;
    rank: number;
}

export interface MatchRequest {
    profileId?: string;
    profileText?: string;
    topN: number;
    minSimilarity?: number;
}

export interface ProfileFormData {
    name: string;
    type: 'patient' | 'donor';
    description: string;
    medicalInfo: string;
    preferences: string;
}
