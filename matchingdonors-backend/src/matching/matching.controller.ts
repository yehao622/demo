import { Request, Response } from "express";
import { MatchingService } from "./matching.service";

const matchingService = new MatchingService();

export class MatchingController {
    async findMatches(req: Request, res: Response): Promise<void> {
        try {
            // 🚀 GUARDRAIL: Extract ignoreConflict flag sent from frontend!
            const { profileId, profileText, searcherType, topN, minSimilarity, ignoreConflict } = req.body;

            if (!profileId && !profileText) {
                res.status(400).json({ error: 'Either profileId or profileText must be provided' });
                return;
            }

            if (!searcherType) {
                res.status(400).json({ error: 'searcherType is required for real data search' });
                return;
            }

            const targetType = searcherType === 'patient' ? 'donor' : 'patient';
            let excludeUserId: number | undefined;

            if (profileId) {
                const parts = profileId.split('-');
                if (parts.length >= 3 && parts[2]) {
                    const userId = parseInt(parts[2]);
                    if (!isNaN(userId)) excludeUserId = userId;
                }
            }

            const searchCriteria = profileText || '';
            const minScore = minSimilarity !== undefined ? minSimilarity * 100 : 50;

            // 🚀 GUARDRAIL: Pass ignoreConflict to the engine
            const searchResult = await matchingService.searchRealProfiles(
                searchCriteria,
                targetType,
                excludeUserId,
                topN || 10,
                minScore,
                ignoreConflict === true
            );

            // 🚀 GUARDRAIL: If the engine caught an organ conflict, bounce it back to the UI!
            if (searchResult.conflict) {
                res.json(searchResult); // { conflict: true, queried: 'Liver', actual: 'Kidney' }
                return;
            }

            const matches = searchResult.matches || [];

            res.json({
                success: true,
                matches,
                count: matches.length,
                searchCriteria: profileText || 'profile-based'
            });

        } catch (error) {
            console.error('Error finding matches:', error);
            res.status(500).json({
                error: 'Failed to find matches',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async getRealProfiles(req: Request, res: Response): Promise<void> {
        try {
            const userType = req.query.type as 'patient' | 'donor' | undefined;
            const excludeUserId = req.query.excludeUserId ? parseInt(req.query.excludeUserId as string) : undefined;

            if (!userType) {
                res.status(400).json({ error: 'type parameter required (patient or donor)' });
                return;
            }

            const { ProfileService } = await import('../services/profile.service');
            const profiles = ProfileService.getAllCompleteProfiles(userType, excludeUserId);

            res.json({ success: true, profiles, count: profiles.length, source: 'database' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to load real profiles' });
        }
    }

    async getAllProfiles(req: Request, res: Response): Promise<void> {
        try {
            const { ProfileService } = await import('../services/profile.service');
            const allProfiles = ProfileService.getAllProfilesForDemo();

            const profiles = allProfiles.map(data => ({
                id: data.id,
                name: data.name || 'Unknown',
                type: data.type,
                blood_type: data.blood_type || 'Not specified',
                age: data.age || 0,
                country: data.country || '',
                state: data.state || '',
                city: data.city || '',
                organ_type: data.organ_type || 'Not specified',
                description: data.description || 'No description provided',
                medical_info: data.medical_info || '',
                preferences: data.preferences || '',
                is_complete: data.is_complete || false,
                is_public: data.is_public || false
            }));

            res.json({
                success: true,
                profiles: profiles,
                count: profiles.length,
                source: 'database-all'
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get profiles' });
        }
    }
}