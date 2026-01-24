import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class TranscriptionService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is required');
        }
        
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    }

    async transcribe(audioBuffer: Buffer, mimeType: string): Promise<string> {
        try {
            // Save audio to temporary file (Gemini API requires file path or base64)
            const tempDir = os.tmpdir();
            const tempFilePath = path.join(tempDir, `audio-${Date.now()}.webm`);
            fs.writeFileSync(tempFilePath, audioBuffer);

            try {
                // Convert audio to base64
                const audioBase64 = audioBuffer.toString('base64');

                // Prepare the request with audio inline data
                const result = await this.model.generateContent([
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: audioBase64
                        }
                    },
                    {
                        text: 'Please transcribe the speech in this audio file. Return ONLY the transcribed text, nothing else. If there is no speech, return an empty response.'
                    }
                ]);

                const response = await result.response;
                const transcript = response.text().trim();

                console.log('Gemini transcription:', transcript);
                return transcript;
            } finally {
                // Clean up temp file
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }
            }
        } catch (error: any) {
            console.error('Transcription error:', error);
            throw new Error('Failed to transcribe audio: ' + error.message);
        }
    }
}