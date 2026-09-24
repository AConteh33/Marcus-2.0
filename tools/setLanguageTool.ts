import type { FunctionDeclaration } from "@google/genai";
import type { Tool } from "./tool";

export type UILanguage = 'ar' | 'en';

export class SetLanguageTool implements Tool {
    private onLanguageChange: (lang: UILanguage) => void;

    constructor(onLanguageChange: (lang: UILanguage) => void) {
        this.onLanguageChange = onLanguageChange;
    }

    getDeclaration(): FunctionDeclaration {
        return {
            name: 'setLanguage',
            description: 'Switch the UI language. Call this when the user speaks a different language. Use "ar" for Arabic and "en" for English.',
            parameters: {
                type: 'OBJECT',
                properties: {
                    language: {
                        type: 'STRING',
                        enum: ['ar', 'en'],
                        description: 'The language code: "ar" for Arabic, "en" for English'
                    }
                },
                required: ['language']
            }
        };
    }

    async execute(args: { language: UILanguage }): Promise<string> {
        const lang = args.language === 'ar' || args.language === 'en' ? args.language : 'ar';
        this.onLanguageChange(lang);
        return `Language switched to ${lang === 'ar' ? 'Arabic' : 'English'}. UI updated.`;
    }
}
