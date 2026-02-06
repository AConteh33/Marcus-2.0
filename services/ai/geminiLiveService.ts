import { GoogleGenAI } from "@google/genai";
import type { AIConversationService, AIConnectOptions } from './aiService';


export class GeminiLiveService implements AIConversationService {
    private ai: GoogleGenAI;
    private sessionPromise: Promise<any> | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 3;
    private connectionOptions: any = null;

    constructor() {
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'undefined' || apiKey === '') {
            throw new Error("API_KEY environment variable not set. Please set GEMINI_API_KEY in your .env.local file.");
        }
        this.ai = new GoogleGenAI({ apiKey });
    }

    connect(options: AIConnectOptions): void {
        this.connectionOptions = options;
        this.attemptConnection();
    }

    private async attemptConnection(): Promise<void> {
        try {
            console.log(`=== GEMINI CONNECTION ATTEMPT ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts} ===`);
            console.log('API Key:', process.env.API_KEY || process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');
            console.log('Model: gemini-2.5-flash-native-audio-preview-12-2025');
            console.log('Tools count:', this.connectionOptions.config.tools?.length || 0);
            console.log('System instruction length:', this.connectionOptions.config.systemInstruction?.length || 0);
            
            // Log first few tool details for debugging
            if (this.connectionOptions.config.tools && this.connectionOptions.config.tools.length > 0) {
                console.log('First tool sample:', JSON.stringify(this.connectionOptions.config.tools[0], null, 2).substring(0, 500) + '...');
            }
            
            console.log('Attempting connection...');
            
            this.sessionPromise = (this.ai as any).live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: this.connectionOptions.callbacks,
                config: {
                    responseModalities: ['AUDIO'],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    tools: this.connectionOptions.config.tools,
                    systemInstruction: this.connectionOptions.config.systemInstruction,
                }
            });
            
            console.log('Connection promise created successfully');
            console.log('=== GEMINI CONNECTION SUCCESS ===');
            
            // Reset reconnect attempts on successful connection
            this.reconnectAttempts = 0;
            
        } catch (error) {
            console.error(`=== CONNECTION ERROR ATTEMPT ${this.reconnectAttempts + 1} ===`);
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('Full error:', error);
            
            this.reconnectAttempts++;
            
            // Try reconnection if we haven't reached max attempts
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                console.log(`Retrying connection in 2 seconds... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                setTimeout(() => {
                    this.attemptConnection();
                }, 2000);
            } else {
                // Max attempts reached, try fallback model
                console.log('Max attempts reached, trying fallback model...');
                this.tryFallbackConnection();
            }
        }
    }

    private async tryFallbackConnection(): Promise<void> {
        try {
            console.log('Trying fallback model...');
            this.sessionPromise = (this.ai as any).live.connect({
                model: 'gemini-1.5-flash',
                callbacks: this.connectionOptions.callbacks,
                config: {
                    responseModalities: ['AUDIO'],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    tools: this.connectionOptions.config.tools,
                    systemInstruction: this.connectionOptions.config.systemInstruction,
                }
            });
            console.log('Fallback connection successful');
            this.reconnectAttempts = 0;
        } catch (fallbackError) {
            console.error('=== FALLBACK ERROR DEBUG ===');
            console.error('Fallback error type:', fallbackError.constructor.name);
            console.error('Fallback error message:', fallbackError.message);
            console.error('Fallback error stack:', fallbackError.stack);
            
            // Only show error popup after all reconnection attempts and fallback have failed
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                throw new Error(`Connection failed after ${this.maxReconnectAttempts} attempts. Primary: ${fallbackError.message}`);
            }
        }
    }

    sendAudio(audioBlob: any): void {
        this.sessionPromise?.then(session => {
            session.sendRealtimeInput({ media: audioBlob });
        }).catch(error => {
            console.error('Audio send error:', error);
            this.handleConnectionError(error);
        });
    }

    sendText(text: string): void {
        this.sessionPromise?.then(session => {
            // Send text as realtime input - the API will convert it to audio
            session.sendRealtimeInput({ text });
        }).catch(error => {
            console.error('Text send error:', error);
            this.handleConnectionError(error);
        });
    }
    
    sendToolResponse(toolResponse: any): void {
        this.sessionPromise?.then(session => {
            session.sendRealtimeInput({ toolResponse });
        }).catch(error => {
            console.error('Tool response error:', error);
            this.handleConnectionError(error);
        });
    }

    disconnect(): void {
        this.sessionPromise?.then(session => {
            session.disconnect();
        }).catch(console.error);
        this.sessionPromise = null;
        this.reconnectAttempts = 0;
    }

    private handleConnectionError(error: any): void {
        console.error('Connection error detected:', error);
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log('Attempting automatic reconnection...');
            this.reconnectAttempts++;
            setTimeout(() => {
                this.attemptConnection();
            }, 2000);
        }
    }

    public manualRetry(): void {
        console.log('Manual retry requested...');
        this.reconnectAttempts = 0;
        this.attemptConnection();
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
