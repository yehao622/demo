import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export interface SponsorProfileData {
    organization_name?: string;
    contact_phone?: string;
    website?: string;
    sponsor_type: 'individual' | 'organization';
    interests?: string; // e.g., "advertising,property_donation"
    additional_notes?: string;
}

export class SponsorProfileService {
    private static getHeaders() {
        const token = localStorage.getItem('auth_token');
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        };
    }

    static async getProfile(): Promise<{ success: boolean; profile: SponsorProfileData | null }> {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/sponsor-profile/me`, {
                headers: this.getHeaders()
            });
            return response.data;
        } catch (error: any) {
            // If it's a 404 or empty, just return null so the form starts blank
            return { success: true, profile: null };
        }
    }

    static async saveProfile(data: SponsorProfileData): Promise<{ success: boolean; profile: SponsorProfileData }> {
        const response = await axios.post(`${API_BASE_URL}/api/sponsor-profile/save`, data, {
            headers: this.getHeaders()
        });
        return response.data;
    }
}