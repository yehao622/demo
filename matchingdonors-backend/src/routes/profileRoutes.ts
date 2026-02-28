import express, { Request, Response } from 'express';
import { GoogleGenAI } from "@google/genai";
import { authMiddleware } from '../middleware/auth.middleware';
import { ProfileService } from '../services/profile.service';
import { MatchingService } from '../matching/matching.service';
import multer from 'multer';
import { TranscriptionService } from '../services/TranscriptionService';
import { BaseProfile } from '../models/profile.model';

const router = express.Router();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
}
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

// const profileAgent = new ProfileAgent();
const transcriptionService = new TranscriptionService();

// Configure multer for audio file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    },
    fileFilter: (req, file, cb) => {
        // Accept audio files
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed'));
        }
    },
});

// Get current user's profile (protected route)
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const userId = req.user.id;
        const userRole = req.user.role as 'patient' | 'donor';

        const profile = ProfileService.getUserProfile(userId, userRole);
        const hasComplete = ProfileService.hasCompleteProfile(userId, userRole);

        if (profile) {
            // This satisfies TypeScript while handling the runtime value correctly.
            const isPublicValue = profile.is_public as any;
            // This ensures the "Edit Profile" toggle shows the correct state
            const safeProfile = {
                ...profile,
                isPublic: isPublicValue === 1 || isPublicValue === true
            };

            res.json({
                success: true,
                profile: safeProfile,
                hasCompleteProfile: hasComplete,
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Profile not found',
            });
        }
    } catch (error: any) {
        console.error('Get profile error:', error);
        res.status(500).json({
            error: 'Failed to get profile',
            details: error.message,
        });
    }
});

// Save user's profile (protected route)
router.post('/save', authMiddleware, async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const userId = req.user.id;
        const userRole = req.user.role as 'patient' | 'donor';
        const {
            name,
            age,
            blood_type,
            organ_type,
            city,
            state,
            country,
            description,
            medical_info,
            preferences,
            is_public,
        } = req.body;

        // Get user's name
        const userName = `${req.user!.firstName} ${req.user!.lastName}`;

        const profileData = {
            user_id: userId,
            name: name || userName,
            type: userRole,
            blood_type: blood_type || '',
            age: age || 0,
            country: country || '',
            state: state || '',
            city: city || '',
            organ_type: organ_type || '',
            description: description || '',
            medical_info: medical_info || '',
            preferences: preferences || '',
            is_public: is_public !== undefined ? is_public : true,
        } as unknown as BaseProfile;

        const savedProfile = ProfileService.saveProfile(profileData);

        // Trigger Background Match Scanner
        const matchingService = new MatchingService();
        // Note: We deliberately do NOT use 'await' here. 
        // This lets the HTTP response finish instantly while the AI search runs silently in the background!
        matchingService.checkAndSendMatchAlerts(userId, userRole).catch(err => console.error("Scanner Error:", err));

        res.json({
            success: true,
            message: 'Profile saved successfully',
            profile: savedProfile,
        });
    } catch (error: any) {
        console.error('Save profile error:', error);
        res.status(500).json({
            error: 'Failed to save profile',
            details: error.message,
        });
    }
});

// Validate user input for role/tab mismatches (protected route)
router.post('/validate', authMiddleware, async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { text, currentTab } = req.body;
        const userRole = req.user.role as 'patient' | 'donor';

        if (!text || !currentTab) {
            return res.status(400).json({
                error: 'Text and currentTab are required',
            });
        }

        const validation = await ProfileService.validateUserInput(
            text,
            userRole,
            currentTab
        );

        res.json({ success: true, validation });
    } catch (error: any) {
        console.error('Validation error:', error);
        res.status(500).json({
            error: 'Failed to validate input',
            details: error.message,
        });
    }
});

// Update user's profile (protected route)
router.put('/update', authMiddleware, async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const userId = req.user.id;
        const userRole = req.user.role as 'patient' | 'donor';
        // console.log('📝 Received Update Payload:', req.body);
        const { summary, organType, age, bloodType, location, personalStory, isPublic,
            description, organ_type, blood_type, medical_info, is_public, preferences,
            city: cityRaw, state: stateRaw, country: countryRaw } = req.body;

        let finalCity = cityRaw || '';
        let finalState = stateRaw || '';
        let finalCountry = countryRaw || 'USA';

        if (location) {
            const locationParts = location.split(',').map((s: string) => s.trim());
            finalCity = locationParts[0] || finalCity;
            finalState = locationParts[1] || finalState;
            finalCountry = locationParts[2] || locationParts[1] || finalCountry;
        }

        const userName = `${req.user!.firstName} ${req.user!.lastName}`;
        const real_is_public = isPublic !== undefined ? isPublic : is_public;


        const profileData = {
            user_id: userId,
            name: userName,
            type: userRole,
            age: parseInt(age) || 0,

            // Robust Field Mapping: New Key || Old Key || Empty String
            blood_type: bloodType || blood_type || '',
            organ_type: organType || organ_type || '',
            description: summary || description || '',
            medical_info: personalStory || medical_info || '',

            city: finalCity,
            state: finalState,
            country: finalCountry,

            preferences: preferences || '',
            is_public: real_is_public !== undefined ? real_is_public : true,
        } as unknown as BaseProfile;

        const updatedProfile = ProfileService.saveProfile(profileData);

        // Trigger Background Match Scanner ---
        const matchingService = new MatchingService();
        matchingService.checkAndSendMatchAlerts(userId, userRole).catch(err => console.error("Scanner Error:", err));

        res.json({
            success: true,
            message: 'Profile updated successfully',
            profile: updatedProfile,
        });
    } catch (error: any) {
        console.error('Update profile error:', error);
        res.status(500).json({
            error: 'Failed to update profile',
            details: error.message,
        });
    }
});

// Delete user's profile (protected route)
router.delete('/me', authMiddleware, async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const userId = req.user.id;
        const userRole = req.user.role as 'patient' | 'donor';

        const deleted = ProfileService.deleteProfile(userId, userRole);

        if (deleted) {
            res.json({
                success: true,
                message: 'Profile deleted successfully',
            });
        } else {
            res.status(404).json({
                error: 'Profile not found',
            });
        }
    } catch (error: any) {
        console.error('Delete profile error:', error);
        res.status(500).json({
            error: 'Failed to delete profile',
            details: error.message,
        });
    }
});

//  Transcribe audio to text
router.post('/transcribe', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No audio file provided'
            });
        }

        console.log('Transcribing audio file:', req.file.originalname, 'Size:', req.file.size, 'bytes');

        const transcript = await transcriptionService.transcribe(req.file.buffer, req.file.mimetype);

        if (!transcript || transcript.trim().length === 0) {
            return res.json({
                transcript: '',
                message: 'No speech detected in the audio'
            });
        }

        console.log('Transcription successful:', transcript);
        res.json({ transcript });
    } catch (error: any) {
        console.error('Error transcribing audio:', error);
        res.status(500).json({
            error: 'Failed to transcribe audio. Please try again.'
        });
    }
});

// Get all profiles (for Browse section) - Protected route
router.get('/all', authMiddleware, async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const currentUserId = req.user.id;
        const currentUserRole = req.user.role as 'patient' | 'donor';
        const useRealData = req.query.useRealData === 'true';

        let profiles;
        if (useRealData) {
            // Patient sees Donor, Donor sees Patient.
            const targetType = currentUserRole === 'patient' ? 'donor' : 'patient';
            // Calls the STRICT service method (excludes private & excludes self)
            profiles = ProfileService.getAllCompleteProfiles(targetType, currentUserId);
        } else {
            // Demo mode - include user's profile
            profiles = ProfileService.getAllProfilesForDemo();
        }

        res.json({
            success: true,
            profiles,
        });
    } catch (error: any) {
        console.error('Get all profiles error:', error);
        res.status(500).json({
            error: 'Failed to get profiles',
            details: error.message,
        });
    }
});

// Toggle profile visibility (protected route)
router.patch('/visibility', authMiddleware, async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const userId = req.user.id;
        const userRole = req.user.role as 'patient' | 'donor';
        const { isPublic } = req.body;

        if (typeof isPublic !== 'boolean') {
            return res.status(400).json({
                error: 'isPublic must be a boolean value',
            });
        }

        const updatedProfile = ProfileService.toggleProfileVisibility(userId, userRole, isPublic);

        if (updatedProfile) {
            res.json({
                success: true,
                message: `Profile is now ${isPublic ? 'public' : 'private'}`,
                profile: updatedProfile,
            });
        } else {
            res.status(404).json({
                error: 'Profile not found',
            });
        }
    } catch (error: any) {
        console.error('Toggle visibility error:', error);
        res.status(500).json({
            error: 'Failed to update visibility',
            details: error.message,
        });
    }
});

export default router;