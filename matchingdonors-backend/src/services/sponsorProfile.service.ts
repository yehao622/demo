import db from '../database/init';
import crypto from 'crypto';

export interface SponsorProfileData {
    id?: string;
    user_id: number;
    organization_name?: string;
    contact_phone?: string;
    website?: string;
    sponsor_type: 'individual' | 'organization';
    interests?: string; // Comma-separated list (e.g., "advertising,property_donation")
    additional_notes?: string;
}

export class SponsorProfileService {
    // Fetch a sponsor's profile by their User ID
    static getProfile(userId: number): SponsorProfileData | null {
        const profile = db.prepare(`
            SELECT * FROM sponsor_profiles WHERE user_id = ?
        `).get(userId) as SponsorProfileData | undefined;

        return profile || null;
    }

    // Create or update a sponsor's profile
    static saveProfile(userId: number, data: Partial<SponsorProfileData>): SponsorProfileData {
        const existing = this.getProfile(userId);

        if (existing) {
            // Update existing profile
            db.prepare(`
                UPDATE sponsor_profiles 
                SET organization_name = ?, contact_phone = ?, website = ?, 
                    sponsor_type = ?, interests = ?, additional_notes = ?, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            `).run(
                data.organization_name || null,
                data.contact_phone || null,
                data.website || null,
                data.sponsor_type || 'organization',
                data.interests || null,
                data.additional_notes || null,
                userId
            );
        } else {
            // Create a new profile
            const id = crypto.randomUUID();
            db.prepare(`
                INSERT INTO sponsor_profiles (
                    id, user_id, organization_name, contact_phone, website, 
                    sponsor_type, interests, additional_notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                id,
                userId,
                data.organization_name || null,
                data.contact_phone || null,
                data.website || null,
                data.sponsor_type || 'organization',
                data.interests || null,
                data.additional_notes || null
            );
        }

        return this.getProfile(userId)!;
    }
}