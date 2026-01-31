import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import type { Tool } from "./tool";
import { promptService } from "../prompts/promptService";

export class SetLanguagePreferenceTool implements Tool {
    getDeclaration(): FunctionDeclaration {
        return {
            name: 'setLanguagePreference',
            parameters: {
                type: Type.OBJECT,
                description: 'Sets the preferred language for communication. Use this when the user explicitly requests to communicate in a specific language.',
                properties: {
                    language: { 
                        type: Type.STRING, 
                        description: 'The language name the user wants to use (e.g., "English", "Arabic", "Spanish", "French", etc.). Use the full language name.' 
                    }
                },
                required: ['language']
            }
        };
    }

    async execute(args: { language: string }): Promise<string> {
        if (!args.language) {
            return "Error: Language is required to set preference.";
        }
        promptService.setPreferredLanguage(args.language);
        return `Language preference set to ${args.language}. I will now communicate in ${args.language} throughout our conversation.`;
    }
}

