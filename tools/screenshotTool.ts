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
            
            // Use Electron's native screenshot API instead of server
            if (typeof window !== 'undefined' && window.electronAPI) {
                const response = await window.electronAPI.takeScreenshot({ savePath });
                return response;
            }
            
            // Fallback for browser environment - local only
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const defaultSavePath = savePath || `/Users/ace/Desktop/Marcus Screenshots/screenshot-${timestamp}.png`;
            
            return `Screenshot functionality requires Electron environment. In browser mode, screenshots would be saved to: ${defaultSavePath}`;
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Screenshot tool error:', errorMessage);
            return `Failed to take screenshot: ${errorMessage}`;
        }
    }
}
