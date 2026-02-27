import api from './api';

export interface SponsorProfileData {
    organization_name?: string;
    contact_phone?: string;
    website?: string;
    sponsor_type: 'individual' | 'organization';
    interests?: string; // e.g., "advertising,property_donation"
    additional_notes?: string;
}

export class SponsorProfileService {
    static async getProfile(): Promise<{ success: boolean; profile: SponsorProfileData | null }> {
        try {
            const response = await api.get('/api/sponsor-profile/me');
            return response.data;
        } catch (error: any) {
            // If it's a 404 or empty, just return null so the form starts blank
            return { success: true, profile: null };
        }
    }

    static async saveProfile(data: SponsorProfileData): Promise<{ success: boolean; profile: SponsorProfileData }> {
        const response = await api.post('/api/sponsor-profile/save', data);
        return response.data;
    }
}