import { Router, Request, Response } from 'express';
import { authMiddleware, authorizeRole } from '../middleware/auth.middleware';
import { SponsorProfileService } from '../services/sponsorProfile.service';

const router = Router();

// Apply authorization once for all routes in this file
router.use(authMiddleware, authorizeRole('sponsor'));

// GET /api/sponsor-profile/me
// Fetch the logged-in sponsor's profile
router.get('/me', (req: Request, res: Response) => {
    try {
        const profile = SponsorProfileService.getProfile(req.user!.id);
        res.json({ success: true, profile });
    } catch (error: any) {
        console.error('Error fetching sponsor profile:', error);
        res.status(500).json({ error: 'Failed to fetch sponsor profile' });
    }
});

// POST /api/sponsor-profile/save
// Create or update the logged-in sponsor's profile
router.post('/save', (req: Request, res: Response) => {
    try {
        const profileData = req.body;
        const updatedProfile = SponsorProfileService.saveProfile(req.user!.id, profileData);

        res.json({ success: true, profile: updatedProfile });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to save sponsor profile' });
    }
});

export default router;