import { GoogleGenAI } from "@google/genai";
import type { AIConversationService, AIConnectOptions, AIConversationCallbacks, AIConversationConfig } from './aiService';
import type { LiveServerMessage } from "@google/genai";

interface ToolResponse {
    functionCall?: any;
    functionResponse?: any;
}

export class GeminiTextService implements AIConversationService {
    private chat: any = null;
    private ai: GoogleGenAI;
    private callbacks: AIConversationCallbacks | null = null;
    private isConnected: boolean = false;

    constructor() {
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'undefined' || apiKey === '') {
            throw new Error("API_KEY environment variable not set. Please set GEMINI_API_KEY in your .env.local file.");
        }
        this.ai = new GoogleGenAI({ apiKey });
    }

    connect(options: AIConnectOptions): void {
        try {
            console.log('=== GEMINI TEXT SERVICE CONNECTION ===');
            console.log('Model: gemini-2.5-flash');
            console.log('Tools count:', options.config.tools?.length || 0);
            
            this.callbacks = options.callbacks;
            
            // Initialize chat with tools
            const model = (this.ai as any).getGenerativeModel({
                model: 'gemini-2.5-flash',
                systemInstruction: options.config.systemInstruction,
                tools: options.config.tools
            });
            
            this.chat = model.startChat({
                history: [],
                generationConfig: {
                    maxOutputTokens: 8192,
                    temperature: 0.7,
                }
            });
            
            this.isConnected = true;
            console.log('🟢 TEXT SERVICE: Connected successfully');
            
            // Trigger onopen callback
            if (this.callbacks?.onopen) {
                this.callbacks.onopen();
            }
            
        } catch (error) {
            console.error('❌ TEXT SERVICE: Connection failed:', error);
            if (this.callbacks?.onerror) {
                this.callbacks.onerror(error as ErrorEvent);
            }
        }
    }

    async sendText(text: string): Promise<void> {
        if (!this.isConnected || !this.chat || !this.callbacks) {
            console.error('❌ TEXT SERVICE: Not connected');
            return;
        }

        try {
            console.log('📤 TEXT SERVICE: Sending text:', text.substring(0, 50) + '...');
            
            const result = await this.chat.sendMessage(text);
            const response = result.response;
            const textResponse = response.text();
            
            console.log('📥 TEXT SERVICE: Received response:', textResponse.substring(0, 50) + '...');
            
            // Create a mock LiveServerMessage for compatibility
            const mockMessage: LiveServerMessage = {
                serverContent: {
                    modelTurn: {
                        parts: [{
                            text: textResponse
                        }]
                    }
                },
                text: textResponse,
                data: undefined
            };
            
            // Send to message handler
            this.callbacks.onmessage(mockMessage);
            
        } catch (error) {
            console.error('❌ TEXT SERVICE: Send failed:', error);
            if (this.callbacks.onerror) {
                this.callbacks.onerror(error as ErrorEvent);
            }
        }
    }

    sendAudio(audioBlob: any): void {
        // Text service doesn't support audio input
        console.warn('⚠️ TEXT SERVICE: Audio input not supported');
    }

    sendToolResponse(toolResponse: ToolResponse): void {
        if (!this.chat) {
            console.error('❌ TEXT SERVICE: No active chat');
            return;
        }

        try {
            console.log('🔧 TEXT SERVICE: Sending tool response');
            // For text service, we need to continue the conversation with tool results
            // This is a simplified implementation
            this.chat.sendMessage(`Tool result: ${JSON.stringify(toolResponse.functionResponse?.response || {})}`);
        } catch (error) {
            console.error('❌ TEXT SERVICE: Tool response failed:', error);
        }
    }

    close(): void {
        console.log('🔴 TEXT SERVICE: Closing connection');
        this.isConnected = false;
        this.chat = null;
        
        if (this.callbacks?.onclose) {
            this.callbacks.onclose();
        }
        
        this.callbacks = null;
    }
}
