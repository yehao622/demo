import { GoogleGenAI } from "@google/genai";

export class TranscriptionService {
    private ai: GoogleGenAI;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is required');
        }
        
        this.ai = new GoogleGenAI({ apiKey });
    }

    async transcribe(audioBuffer: Buffer, mimeType: string): Promise<string> {
        try {
            console.log('Starting transcription with Gemini...');
            
            // Convert audio to base64
            const audioBase64 = audioBuffer.toString('base64');

            // Use Gemini 2.0 Flash for audio transcription
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.0-flash-exp',
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                inlineData: {
                                    mimeType: mimeType,
                                    data: audioBase64
                                }
                            },
                            {
                                text: 'Please transcribe the speech in this audio file. Return ONLY the transcribed text, nothing else. If there is no speech, return an empty response.'
                            }
                        ]
                    }
                ]
            });

            const transcript = response.text?.trim() || '';
            console.log('Gemini transcription result:', transcript);
            
            return transcript;
        } catch (error: any) {
            console.error('Transcription error:', error);
            throw new Error('Failed to transcribe audio: ' + error.message);
        }
    }
}