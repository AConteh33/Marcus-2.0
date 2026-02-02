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
            // First try connecting without tools to test the model
            console.log('Testing connection without tools first...');
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
            console.log('Connected successfully without tools - now trying with tools...');
            
            // If that works, try with tools
            setTimeout(() => {
                try {
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
                } catch (toolsError) {
                    console.error('Failed to connect with tools:', toolsError);
                    // Keep the no-tools connection
                }
            }, 1000);
            
        } catch (error) {
            console.error('Failed to connect even without tools:', error);
            throw new Error(`Failed to connect to Gemini API: ${error instanceof Error ? error.message : String(error)}`);
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
