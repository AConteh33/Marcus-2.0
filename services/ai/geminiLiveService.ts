import { GoogleGenAI, GenerateContentStreamResult, GenerativeModel } from "@google/genai";
import type { AIConversationService, AIConnectOptions } from './aiService';


export class GeminiLiveService implements AIConversationService {
    private ai: GoogleGenAI;
    private model: GenerativeModel | null = null;
    private currentSession: GenerateContentStreamResult | null = null;

    constructor() {
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'undefined' || apiKey === '') {
            throw new Error("API_KEY environment variable not set. Please set GEMINI_API_KEY in your .env.local file.");
        }
        this.ai = new GoogleGenAI({ apiKey });
    }

    async connect(options: AIConnectOptions): Promise<void> {
        try {
            // Comprehensive debugging
            console.log('=== GEMINI API CONNECTION DEBUG START ===');
            console.log('API Key:', process.env.API_KEY || process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');
            console.log('Model: gemini-2.5-flash-exp');
            console.log('Tools count:', options.config.tools?.length || 0);
            console.log('System instruction length:', options.config.systemInstruction?.length || 0);

            // Log first few tool details for debugging
            if (options.config.tools && options.config.tools.length > 0) {
                console.log('First tool sample:', JSON.stringify(options.config.tools[0], null, 2).substring(0, 500) + '...');
            }

            console.log('Attempting connection...');

            // Use regular Gemini API with streaming instead of Live API
            this.model = this.ai.getGenerativeModel({
                model: 'gemini-2.5-flash-exp',
                tools: options.config.tools,
                systemInstruction: options.config.systemInstruction,
            });

            console.log('Model initialized successfully');
            console.log('=== GEMINI API CONNECTION DEBUG END ===');

            // Simulate connection success
            options.callbacks.onopen();

        } catch (error) {
            console.error('=== CONNECTION ERROR DEBUG ===');
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('Full error:', error);

            throw error;
        }
    }

    async sendText(text: string): Promise<void> {
        try {
            console.log('Sending text to Gemini API:', text.substring(0, 100) + '...');

            if (!this.model) {
                throw new Error('Model not initialized');
            }

            // Start streaming conversation
            this.currentSession = await this.model.generateContentStream({
                contents: [{ role: 'user', parts: [{ text }] }]
            });

            let fullResponse = '';

            // Process streaming response
            for await (const chunk of this.currentSession.stream) {
                const chunkText = chunk.text();
                if (chunkText) {
                    fullResponse += chunkText;
                    console.log('Received chunk:', chunkText);
                }
            }

            console.log('Full response received:', fullResponse);

        } catch (error) {
            console.error('Error sending text:', error);
            throw error;
        }
    }

    sendAudio(audioBlob: any): void {
        // Audio input not supported in regular Gemini API
        console.log('Audio input received but not supported in regular Gemini API - using text only');
    }

    sendToolResponse(toolResponse: any): void {
        // Handle tool responses from previous interactions
        console.log('Tool response received:', toolResponse);
    }

    close(): void {
        console.log('Closing Gemini API session');
        this.currentSession = null;
        this.model = null;
    }

    async generateContent(prompt: string): Promise<string> {
        try {
            if (!this.model) {
                throw new Error('Model not initialized');
            }

            const response = await this.model.generateContent({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
            });
            return response.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch (error) {
            console.error('Generate content error:', error);
            throw error;
        }
    }
}
