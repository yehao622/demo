import express, { Request, Response } from 'express';
import { GoogleGenAI } from "@google/genai";
import { authMiddleware } from '../middleware/auth.middleware';
import { ProfileService } from '../services/profile.service';
import { parseGeminiResponse } from '../profile/parseGeminiProfileResponse';
import multer from 'multer';
// import { ProfileAgent } from '../agents/ProfileAgent';
import { TranscriptionService } from '../services/TranscriptionService';
import { buildProfilePrompt } from '../profile/buildProfilePrompt';

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

// Existing route: Generate profile suggestion
// router.post('/suggest', async (req, res) => {
//     try {
//         const { text } = req.body;

//         if (!text || text.trim().length < 20) {
//             return res.status(400).json({
//                 error: 'Please provide at least 20 characters of text'
//             });
//         }

//         const prompt = buildProfilePrompt(text);
//         const response = await ai.models.generateContent({
//             model: 'gemini-2.5-flash',
//             contents: prompt
//         });

//         // const suggestion = await profileAgent.generateSuggestion(text);
//         // res.json({ suggestion });
//         const suggestion = parseGeminiResponse(response.text?.trim());
//         res.json({ success: true, suggestion });
//     } catch (error: any) {
//         console.error('Error generating suggestion:', error);
//         res.status(500).json({
//             error: 'Failed to generate suggestion. Please try again.'
//         });
//     }
// });

// Get current user's profile (protected route)
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const userId = req.user.id;
        const userRole = req.user.role;

        const profile = ProfileService.getUserProfile(userId, userRole);
        const hasComplete = ProfileService.hasCompleteProfile(userId, userRole);

        res.json({
            success: true,
            profile,
            hasCompleteProfile: hasComplete,
        });
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
        const userRole = req.user.role;
        const { summary, organType, age, bloodType, location, personalStory } = req.body;

        // Parse location
        const locationParts = (location || '').split(',').map((s: string) => s.trim());
        const city = locationParts[0] || '';
        const state = locationParts[1] || '';
        const country = locationParts[2] || locationParts[1] || 'USA';

        // Get user's name
        const userName = `${req.user!.firstName} ${req.user!.lastName}`;

        const profileData = {
            user_id: userId,
            name: userName,
            type: userRole,
            blood_type: bloodType || '',
            age: parseInt(age) || 0,
            country,
            state,
            city,
            organ_type: organType || '',
            description: summary || '',
            medical_info: personalStory || '',
            preferences: '',
        };

        const savedProfile = ProfileService.saveProfile(profileData);

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
        const userRole = req.user.role;

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
        const userRole = req.user.role;
        const { summary, organType, age, bloodType, location, personalStory } = req.body;

        // Parse location
        const locationParts = (location || '').split(',').map((s: string) => s.trim());
        const city = locationParts[0] || '';
        const state = locationParts[1] || '';
        const country = locationParts[2] || locationParts[1] || 'USA';

        const userName = `${req.user!.firstName} ${req.user!.lastName}`;

        const profileData = {
            user_id: userId,
            name: userName,
            type: userRole,
            blood_type: bloodType || '',
            age: parseInt(age) || 0,
            country,
            state,
            city,
            organ_type: organType || '',
            description: summary || '',
            medical_info: personalStory || '',
            preferences: '',
        };

        const updatedProfile = ProfileService.saveProfile(profileData);

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
        const userRole = req.user.role;

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

// New route: Transcribe audio to text
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

export default router;