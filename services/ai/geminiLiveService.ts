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
            // Comprehensive debugging
            console.log('=== GEMINI CONNECTION DEBUG START ===');
            console.log('API Key:', process.env.API_KEY || process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');
            console.log('Connecting with Gemini 2.5-flash-native-audio-preview-09-2025 and tools:', options.config.tools?.length || 0, 'tools');
            console.log('System instruction length:', options.config.systemInstruction?.length || 0);
            
            // Log first few tool details for debugging
            if (options.config.tools && options.config.tools.length > 0) {
                console.log('First tool sample:', JSON.stringify(options.config.tools[0], null, 2).substring(0, 500) + '...');
            }
            
            console.log('Attempting connection...');
            
            this.sessionPromise = (this.ai as any).live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: options.callbacks,
                config: {
                    responseModalities: ['AUDIO'],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    tools: options.config.tools,
                    systemInstruction: options.config.systemInstruction,
                }
            });
            
            console.log('Connection promise created successfully');
            console.log('=== GEMINI CONNECTION DEBUG END ===');
            
        } catch (error) {
            console.error('=== CONNECTION ERROR DEBUG ===');
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('Full error:', error);
            
            // Try fallback with debugging
            try {
                console.log('Trying fallback model gemini-2.5-flash-native-audio-preview-09-2025...');
                this.sessionPromise = (this.ai as any).live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    callbacks: options.callbacks,
                    config: {
                        responseModalities: ['AUDIO'],
                        inputAudioTranscription: {},
                        outputAudioTranscription: {},
                        tools: options.config.tools,
                        systemInstruction: options.config.systemInstruction,
                    }
                });
                console.log('Fallback connection successful');
            } catch (fallbackError) {
                console.error('=== FALLBACK ERROR DEBUG ===');
                console.error('Fallback error type:', fallbackError.constructor.name);
                console.error('Fallback error message:', fallbackError.message);
                console.error('Fallback error stack:', fallbackError.stack);
                throw new Error(`Gemini 2.5-flash-native-audio-preview-09-2025 failed: With tools: ${error instanceof Error ? error.message : String(error)}, Fallback: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
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
