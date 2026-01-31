import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import type { Tool } from "./tool";

export class EndSessionTool implements Tool {
    getDeclaration(): FunctionDeclaration {
        return {
            name: 'endSession',
            parameters: {
                type: Type.OBJECT,
                description: 'Ends the current voice session when the conversation is finished or the user wants to exit.',
                properties: {}
            }
        };
    }

    async execute(): Promise<string> {
        // The actual session termination is handled by the useGeminiLive hook
        // when it receives a tool call with this name.
        // This tool just needs to exist for the AI to call it.
        return "Session ending.";
    }
}
