import { Profile } from '../types/profile.types';

export interface CompletenessResult {
    isComplete: boolean;
    missingFields: string[];
}

/**
 * Check if profile is complete (all fields filled)
 */
export const checkProfileCompleteness = (profile: Profile): CompletenessResult => {
    const allFields = [
        { key: 'name', label: 'Name', value: profile.name },
        { key: 'type', label: 'Type', value: profile.type },
        { key: 'description', label: 'Description', value: profile.description },
        { key: 'medicalInfo', label: 'Medical Information', value: profile.medicalInfo },
        { key: 'bloodType', label: 'Blood Type', value: profile.bloodType },
        { key: 'age', label: 'Age', value: profile.age },
        { key: 'country', label: 'Country', value: profile.country },
        { key: 'state', label: 'State', value: profile.state },
        { key: 'city', label: 'City', value: profile.city },
        { key: 'organType', label: 'Organ Type', value: profile.organType },
        { key: 'preferences', label: 'Preferences', value: profile.preferences }
    ];

    const missingFields: string[] = [];

    // Check which fields are missing or empty
    allFields.forEach(field => {
        if (!field.value || (typeof field.value === 'string' && field.value.trim() === '')) {
            missingFields.push(field.label);
        }
    });

    return {
        isComplete: missingFields.length === 0,
        missingFields
    };
};
