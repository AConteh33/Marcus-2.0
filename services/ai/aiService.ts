import type { LiveServerMessage, FunctionDeclaration, Blob, ToolResponse } from "@google/genai";

export interface AIConversationCallbacks {
    onopen: () => void;
    onmessage: (message: LiveServerMessage) => void;
    onerror: (e: ErrorEvent) => void;
    onclose: () => void;
}

export interface AIConversationConfig {
    systemInstruction: string;
    tools: [{ functionDeclarations: FunctionDeclaration[] }];
}

export interface AIConnectOptions {
    callbacks: AIConversationCallbacks;
    config: AIConversationConfig;
}

export interface AIConversationService {
    /**
     * Establishes a connection to the real-time conversation service.
     * @param options - The connection options including callbacks and configuration.
     */
    connect(options: AIConnectOptions): void;

    /**
     * Sends a chunk of audio data to the service.
     * @param audioBlob - The audio data to send.
     */
    sendAudio(audioBlob: Blob): void;

    /**
     * Sends a text message to the service (will be converted to speech).
     * @param text - The text message to send.
     */
    sendText(text: string): void;

    /**
     * Sends the result of a tool call back to the service.
     * @param toolResponse - The response from the executed tool.
     */
    sendToolResponse(toolResponse: ToolResponse): void;

    /**
     * Closes the connection to the service and cleans up resources.
     */
    close(): void;
}
