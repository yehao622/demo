import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { ProfileService } from '../services/profile.service';
import { MatchingService } from '../matching/matching.service';

const router = express.Router();

// 🚀 REAL AI MATCHING ROUTE (Moved from index.ts)
router.get('/matches', authMiddleware, async (req: any, res: any) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const userId = req.user.id;
        const userRole = req.user.role as 'patient' | 'donor';

        const myProfile = ProfileService.getUserProfile(userId, userRole);

        if (!myProfile || !myProfile.organ_type) {
            return res.status(200).json({ matches: [] });
        }

        const targetType = userRole === 'patient' ? 'donor' : 'patient';
        const searchCriteria = `Blood type ${myProfile.blood_type || ''} Age ${myProfile.age || ''} Organ ${myProfile.organ_type}. ${myProfile.description || ''}`;

        const matchingService = new MatchingService();
        const searchResult = await matchingService.searchRealProfiles(
            searchCriteria,
            targetType,
            userId,
            10,
            50,
            true
        );

        const formattedMatches = (searchResult.matches || []).map(match => {
            const locationString = `${match.profile.city || ''}, ${match.profile.state || ''}`
                .replace(/^,\s*|,\s*$/g, '') || 'Location unknown';

            return {
                id: match.profileId,
                name: match.profile.name || 'Anonymous User',
                bloodType: match.profile.blood_type || 'Unknown',
                location: locationString,
                similarity: Math.round(match.similarity * 100)
            };
        });

        res.status(200).json({ matches: formattedMatches });

    } catch (error) {
        console.error('Error fetching real AI matches:', error);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

export default router;