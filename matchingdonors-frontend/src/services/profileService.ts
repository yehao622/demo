import api from './api';
import { Profile } from '../types/profile.types';

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
    async findMatches(request: {
        profileId?: string;
        profileText?: string;
        searcherType?: string;
        topN?: number;
        minSimilarity?: number;
    }): Promise<any> {
        try {
            const url = `/api/matching/find`;  // Always use real data
            const response = await api.post(url, request);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error in findMatches:', error);
            throw new Error(error.response?.data?.error || 'Failed to find matches');
        }
    },


    // Get all stored profiles (for browsing)
    async getAllProfiles(useRealData: boolean = false): Promise<Profile[]> {
        const response = await api.get(`/api/profile/all?useRealData=${useRealData}`);
        const data = response.data;

        return (data.profiles || []).map((p: any) => ({
            ...p,
            // Ensure these fields map correctly
            isComplete: p.is_complete === 1 || p.is_complete === true,
            isPublic: p.is_public === 1 || p.is_public === true,
            medicalInfo: p.medical_info || p.medicalInfo,
            bloodType: p.blood_type || p.bloodType, // Fallback for safety
            preferences: p.preferences || '',
            organType: p.organ_type || p.organType,
            city: p.city || '',
            state: p.state || '',
            country: p.country || '',
        }));
    },

    // Filter profiles by type (patient/donor)
    filterProfilesByType(profiles: Profile[], type: 'patient' | 'donor' | 'all'): Profile[] {
        if (type === 'all') return profiles;
        return profiles.filter(p => p.type === type);
    }
};
