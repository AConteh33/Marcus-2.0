import { GoogleGenAI } from "@google/genai";
import type { AIConversationService, AIConnectOptions } from './aiService';


export class GeminiLiveService implements AIConversationService {
    private sessionPromise: Promise<any> | null = null;
    private ai: GoogleGenAI;

    constructor() {
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'undefined' || apiKey === '') {
            throw new Error("API_KEY environment variable not set. Please set GEMINI_API_KEY in your .env.local file.");
        }
        this.ai = new GoogleGenAI({ apiKey });
    }

    connect(options: AIConnectOptions): void {
        try {
            // Try the primary model first
            this.sessionPromise = (this.ai as any).live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: options.callbacks,
                config: {
                    responseModalities: ['AUDIO'],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    tools: options.config.tools,
                    systemInstruction: options.config.systemInstruction,
                }
            });
        } catch (error) {
            console.error('Failed to connect with primary model, trying fallback:', error);
            try {
                // Try fallback model
                this.sessionPromise = (this.ai as any).live.connect({
                    model: 'gemini-2.0-flash-exp',
                    callbacks: options.callbacks,
                    config: {
                        responseModalities: ['AUDIO'],
                        inputAudioTranscription: {},
                        outputAudioTranscription: {},
                        tools: options.config.tools,
                        systemInstruction: options.config.systemInstruction,
                    }
                });
            } catch (fallbackError) {
                console.error('Failed to connect with fallback model:', fallbackError);
                throw new Error(`Failed to connect to Gemini API: Primary: ${error instanceof Error ? error.message : String(error)}, Fallback: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
            }
        }
    }

    sendAudio(audioBlob: any): void {
        this.sessionPromise?.then(session => {
            session.sendRealtimeInput({ media: audioBlob });
        }).catch(console.error);
    }

    sendText(text: string): void {
        this.sessionPromise?.then(session => {
            // Send text as realtime input - the API will convert it to audio
            session.sendRealtimeInput({ text });
        }).catch(console.error);
    }
    
    sendToolResponse(toolResponse: any): void {
        this.sessionPromise?.then(session => {
            session.sendToolResponse(toolResponse);
        }).catch(console.error);
    }

    close(): void {
        this.sessionPromise?.then(session => {
            session.close();
        }).catch(console.error);
        this.sessionPromise = null;
    }

    async generateContent(prompt: string): Promise<string> {
        try {
            const response = await this.ai.models.generateContent({
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                contents: [{ 
                    parts: [{ 
                        text: prompt 
                    }] 
                }],
            });
            return response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch (error) {
            console.error('Generate content error:', error);
            throw error;
        }
    }
}
