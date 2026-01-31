import { GoogleGenAI, Modality } from "@google/genai";
import type { TTSService } from './ttsService';

export class GeminiTTSService implements TTSService {
    private ai: GoogleGenAI;

    constructor() {
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'undefined' || apiKey === '') {
            throw new Error("API_KEY environment variable not set. Please set GEMINI_API_KEY in your .env.local file.");
        }
        this.ai = new GoogleGenAI({ apiKey });
    }

    async synthesize(text: string, voiceName?: string): Promise<string | null> {
        try {
            // Default voice or use provided voice
            const voice = voiceName || 'Achernar'; // Default to Achernar
            console.log(`🎤 Using voice: ${voice} for text: "${text.substring(0, 30)}..."`);
            
            const response = await this.ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ 
                    parts: [{ 
                        text: `Say: "${text}"` 
                    }] 
                }],
                config: { 
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: voice
                            }
                        }
                    }
                }
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            console.log(`🎤 TTS response received, audio data: ${base64Audio ? 'YES' : 'NO'}`);
            return base64Audio || null;
        } catch (error) {
            console.error("Gemini TTS synthesis failed:", error);
            // Re-throw API key errors to be handled upstream
            if (error instanceof Error && error.message.includes("API key not valid")) {
                throw error;
            }
            return null;
        }
    }
}
