import { Router } from "express";
import multer from 'multer';
import { buildProfilePrompt } from "./buildProfilePrompt";
import { callGemini } from "../common/geminiClient";
import { parseGeminiProfileResponse } from "./parseGeminiProfileResponse";
import { TranscriptionService } from "../services/TranscriptionService";
import console = require("node:console");

const router = Router();
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

router.post("/suggest", async (req, res) => {
    try {
        const { text } = req.body as { text?: string };

        if (!text || text.trim().length < 20) {
            return res.status(400).json({ error: "Text is too short" });
        }

        const prompt = buildProfilePrompt(text);
        const raw = await callGemini(prompt);
        // console.log("RAW GEMINI OUTPUT:\n", raw);
        const suggestion = parseGeminiProfileResponse(raw);

        res.json({ suggestion });
    } catch (err: any) {
        console.error("Patient suggest error:", err);
        res.status(500).json({ error: "Failed to generate suggestion" });
    }
});

// New route: Transcribe audio to text
router.post('/transcribe', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            console.error('No audio file in request');
            return res.status(400).json({
                error: 'No audio file provided'
            });
        }

        console.log('Received audio file:', req.file.originalname, 'Size:', req.file.size, 'bytes', 'Type:', req.file.mimetype);

        const transcript = await transcriptionService.transcribe(req.file.buffer, req.file.mimetype);
        
        if (!transcript || transcript.trim().length === 0) {
            console.log('No speech detected in audio');
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
            error: 'Failed to transcribe audio: ' + error.message
        });
    }
});

export default router;