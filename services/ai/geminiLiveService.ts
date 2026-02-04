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
            // Systematic testing to isolate the issue
            console.log('=== GEMINI CONNECTION DEBUG START ===');
            console.log('API Key:', process.env.API_KEY || process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');
            console.log('Model: gemini-2.5-flash-native-audio-preview-12-2025');
            console.log('Tools count:', options.config.tools?.length || 0);
            console.log('System instruction length:', options.config.systemInstruction?.length || 0);
            
            // Test 1: Minimal config - just audio
            console.log('TEST 1: Attempting connection with minimal config (AUDIO only)...');
            
            this.sessionPromise = (this.ai as any).live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: options.callbacks,
                config: {
                    responseModalities: ['AUDIO'],
                }
            });
            
            console.log('TEST 1: Minimal connection initiated');
            console.log('=== GEMINI CONNECTION DEBUG END ===');
            
        } catch (error) {
            console.error('=== CONNECTION ERROR DEBUG ===');
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('Full error:', error);
            
            // Test 2: Try with system instruction only
            try {
                console.log('TEST 2: Trying with system instruction only...');
                this.sessionPromise = (this.ai as any).live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                    callbacks: options.callbacks,
                    config: {
                        responseModalities: ['AUDIO'],
                        systemInstruction: options.config.systemInstruction,
                    }
                });
                console.log('TEST 2: Connection with system instruction successful');
            } catch (error2) {
                console.error('TEST 2: System instruction also failed');
                
                // Test 3: Try with tools only
                try {
                    console.log('TEST 3: Trying with tools only...');
                    this.sessionPromise = (this.ai as any).live.connect({
                        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                        callbacks: options.callbacks,
                        config: {
                            responseModalities: ['AUDIO'],
                            tools: options.config.tools,
                        }
                    });
                    console.log('TEST 3: Connection with tools successful');
                } catch (error3) {
                    console.error('TEST 3: Tools also failed');
                    
                    // Test 4: Fallback to stable model
                    try {
                        console.log('TEST 4: Falling back to gemini-1.5-flash with full config...');
                        this.sessionPromise = (this.ai as any).live.connect({
                            model: 'gemini-1.5-flash',
                            callbacks: options.callbacks,
                            config: {
                                responseModalities: ['AUDIO'],
                                inputAudioTranscription: {},
                                outputAudioTranscription: {},
                                tools: options.config.tools,
                                systemInstruction: options.config.systemInstruction,
                            }
                        });
                        console.log('TEST 4: Fallback model connection successful');
                    } catch (fallbackError) {
                        console.error('=== ALL TESTS FAILED ===');
                        console.error('Fallback error:', fallbackError.message);
                        throw new Error(`All connection attempts failed. Primary: ${error.message}, SystemInstr: ${error2.message}, Tools: ${error3.message}, Fallback: ${fallbackError.message}`);
                    }
                }
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
