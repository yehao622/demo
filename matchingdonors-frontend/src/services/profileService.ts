import api from './api';
import { Profile, MatchRequest, MatchResult } from '../types/profile.types';

export const profileService = {
    // Store a new profile with AI embedding generation
    async storeProfile(profile: Profile): Promise<{ success: boolean; profileId: string; message: string }> {
        try {
            const response = await api.post('/api/matching/store', profile);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Failed to store profile');
        }
    },

    // Find matching profiles using Gemini AI embeddings
    async findMatches(request: MatchRequest): Promise<MatchResult[]> {
        try {
            const response = await api.post('/api/matching/find', request);
            return response.data.matches || [];
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Failed to find matches');
        }
    },

    // Get all stored profiles (for browsing)
    async getAllProfiles(): Promise<Profile[]> {
        try {
            const response = await api.get('/api/matching/profiles');
            return response.data.profiles || [];
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Failed to get profiles');
        }
    },

    // Filter profiles by type (patient/donor)
    filterProfilesByType(profiles: Profile[], type: 'patient' | 'donor' | 'all'): Profile[] {
        if (type === 'all') return profiles;
        return profiles.filter(p => p.type === type);
    }
};
