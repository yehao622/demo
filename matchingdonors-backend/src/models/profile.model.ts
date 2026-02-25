export type UserRole = 'patient' | 'donor' | 'sponsor';

export interface BaseProfile {
    id: string;
    user_id: number;
    name: string;
    type: 'patient' | 'donor';
    organ_type: string;
    blood_type: string;
    age: number;
    country: string;
    state: string;
    city: string;
    description: string;
    medical_info: string;
    preferences: string;
    is_complete: boolean;
    is_public: boolean;
    created_at?: string;
    updated_at?: string;
}

// For the Matching Engine's specific needs
export interface MatchResult extends BaseProfile {
    similarity: number;
    rank: number;
    reason?: string;
}