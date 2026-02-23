import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { SponsorProfileService } from '../services/sponsorProfile.service';

const router = Router();

// GET /api/sponsor-profile/me
// Fetch the logged-in sponsor's profile
router.get('/me', authMiddleware, (req: Request, res: Response) => {
    try {
        // Extra layer of security: Ensure the user is actually a sponsor
        if (!req.user || req.user.role !== 'sponsor') {
            return res.status(403).json({ error: 'Access denied. Only sponsors can access this profile.' });
        }

        const profile = SponsorProfileService.getProfile(req.user.id);
        res.json({ success: true, profile });
    } catch (error: any) {
        console.error('Error fetching sponsor profile:', error);
        res.status(500).json({ error: 'Failed to fetch sponsor profile' });
    }
});

// POST /api/sponsor-profile/save
// Create or update the logged-in sponsor's profile
router.post('/save', authMiddleware, (req: Request, res: Response) => {
    try {
        // Extra layer of security: Ensure the user is actually a sponsor
        if (!req.user || req.user.role !== 'sponsor') {
            return res.status(403).json({ error: 'Access denied. Only sponsors can access this profile.' });
        }

        const profileData = req.body;
        const updatedProfile = SponsorProfileService.saveProfile(req.user.id, profileData);

        res.json({ success: true, profile: updatedProfile });
    } catch (error: any) {
        console.error('Error saving sponsor profile:', error);
        res.status(500).json({ error: 'Failed to save sponsor profile' });
    }
});

export default router;