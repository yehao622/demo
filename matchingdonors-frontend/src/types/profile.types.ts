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
    reason?: string;
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
