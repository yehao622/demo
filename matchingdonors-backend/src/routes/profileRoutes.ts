import express from 'express';
import multer from 'multer';
import { ProfileAgent } from '../agents/ProfileAgent';
import { TranscriptionService } from '../services/TranscriptionService';

const router = express.Router();
const profileAgent = new ProfileAgent();
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
router.post('/suggest', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim().length < 20) {
            return res.status(400).json({
                error: 'Please provide at least 20 characters of text'
            });
        }

        const suggestion = await profileAgent.generateSuggestion(text);
        res.json({ suggestion });
    } catch (error: any) {
        console.error('Error generating suggestion:', error);
        res.status(500).json({
            error: 'Failed to generate suggestion. Please try again.'
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