import api from './api';
import { Profile, MatchRequest, MatchResult } from '../types/profile.types';
import { use } from 'react';

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
    async findMatches(request: MatchRequest, useRealData: boolean = false): Promise<MatchResult[]> {
        try {
            const url = useRealData
                ? '/api/matching/find?useRealData=true'
                : '/api/matching/find';
            const response = await api.post(url, request);
            return response.data.matches || [];
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Failed to find matches');
        }
    },

    // Get all stored profiles (for browsing)
    async getAllProfiles(useRealData: boolean = false): Promise<Profile[]> {
        try {
            console.log('🔍 getAllProfiles called with useRealData:', useRealData);

            if (useRealData) {
                // Get current user from localStorage to determine which profiles to load
                const userStr = localStorage.getItem('auth_user');
                console.log('📦 Auth data from localStorage:', userStr);

                if (!userStr) {
                    console.warn('⚠️ No auth data found in localStorage');
                    return [];
                }

                const user = JSON.parse(userStr);

                if (!user || !user.role || !user.id) {
                    console.warn('⚠️ Invalid user data:', user);
                    return [];
                }

                const userRole = user.role; // 'patient' or 'donor'
                const userId = user.id;

                // Load opposite type: if user is patient, load donors; if user is donor, load patients
                const targetType = userRole === 'patient' ? 'donor' : 'patient';

                console.log(`👤 Current user: ${userRole} (ID: ${userId})`);
                console.log(`🎯 Loading ${targetType} profiles...`);

                const url = `/api/matching/real-profiles?type=${targetType}&excludeUserId=${userId}`;
                console.log('📡 Fetching:', url);

                const response = await api.get(url);

                console.log('✅ Real profiles loaded:', response.data.profiles.length, 'profiles');

                return response.data.profiles || [];
            } else {
                // Demo mode: use in-memory profiles
                console.log('🟢 Demo mode: loading in-memory profiles');
                const response = await api.get('/api/matching/profiles');
                console.log('✅ Demo profiles loaded:', response.data.profiles.length, 'profiles');
                return response.data.profiles || [];
            }
        } catch (error: any) {
            console.error('❌ Error in getAllProfiles:', error);
            throw new Error(error.response?.data?.error || 'Failed to get profiles');
        }
    },

    // Filter profiles by type (patient/donor)
    filterProfilesByType(profiles: Profile[], type: 'patient' | 'donor' | 'all'): Profile[] {
        if (type === 'all') return profiles;
        return profiles.filter(p => p.type === type);
    }
};
