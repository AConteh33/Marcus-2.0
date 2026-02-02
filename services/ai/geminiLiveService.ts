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
            // Connect directly with tools since we've fixed the tool name mismatches
            console.log('Connecting with tools:', options.config.tools?.length || 0, 'tools');
            
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
            console.log('Connection initiated with tools');
            
        } catch (error) {
            console.error('Failed to connect with tools:', error);
            // Fallback: try without tools for basic functionality
            try {
                console.log('Attempting fallback connection without tools...');
                this.sessionPromise = (this.ai as any).live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                    callbacks: options.callbacks,
                    config: {
                        responseModalities: ['AUDIO'],
                        inputAudioTranscription: {},
                        outputAudioTranscription: {},
                        systemInstruction: options.config.systemInstruction,
                    }
                });
                console.log('Connected in fallback mode without tools');
            } catch (fallbackError) {
                console.error('Fallback connection also failed:', fallbackError);
                throw new Error(`Failed to connect: With tools: ${error instanceof Error ? error.message : String(error)}, Fallback: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
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
