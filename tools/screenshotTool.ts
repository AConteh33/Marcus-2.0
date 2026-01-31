import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import type { Tool } from "./tool";

export class ScreenshotTool implements Tool {
    getDeclaration(): FunctionDeclaration {
        return {
            name: "takeScreenshot",
            description: "Take a screenshot of the current screen and examine it to identify open windows and applications",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    savePath: {
                        type: Type.STRING,
                        description: "Optional path where to save the screenshot (default: auto-generated)"
                    }
                },
                required: []
            }
        };
    }

    async execute(args: { savePath?: string }): Promise<string> {
        try {
            const { savePath } = args;
            
            // Call the screenshot API
            const response = await fetch('http://localhost:3003/api/screenshot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ savePath })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to take screenshot');
            }

            const data = await response.json();
            return data.result;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Screenshot tool error:', errorMessage);
            
            // If the server is not running, provide instructions
            if (errorMessage.includes('fetch') || errorMessage.includes('ECONNREFUSED')) {
                return `Screenshot server is not running. Please start it with:\nnode screenshot-server.js\n\nThen try taking a screenshot again.`;
            }
            
            return `Failed to take screenshot: ${errorMessage}`;
        }
    }
}
