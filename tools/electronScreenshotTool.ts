import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import type { Tool } from "./tool";

export class ElectronScreenshotTool implements Tool {
    getDeclaration(): FunctionDeclaration {
        return {
            name: "takeElectronScreenshot",
            description: "Take a screenshot using Electron's desktopCapturer API. Captures the entire screen or specific windows and saves to file.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    savePath: {
                        type: Type.STRING,
                        description: "Optional path where to save the screenshot (default: auto-generated in temp directory)"
                    },
                    screenIndex: {
                        type: Type.STRING,
                        description: "Optional screen index for multi-monitor setups (default: primary screen)"
                    },
                    windowTitle: {
                        type: Type.STRING,
                        description: "Optional window title to capture specific window instead of full screen"
                    }
                },
                required: []
            }
        };
    }

    async execute(args: { savePath?: string, screenIndex?: string, windowTitle?: string }): Promise<string> {
        try {
            const { savePath, screenIndex, windowTitle } = args;
            
            // Call the Electron screenshot API
            const response = await fetch('http://localhost:3003/api/electron-screenshot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ savePath, screenIndex, windowTitle })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to take Electron screenshot');
            }

            const data = await response.json();
            return data.result;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Electron screenshot tool error:', errorMessage);
            
            // If the server is not running, provide instructions
            if (errorMessage.includes('fetch') || errorMessage.includes('ECONNREFUSED')) {
                return `Electron screenshot service is not running. Please ensure the Electron app is running with the screenshot service enabled.\n\nAlternatively, you can use the standard screenshot tool with:\nnode screenshot-server.js\n\nThen try taking a screenshot again.`;
            }
            
            return `Failed to take Electron screenshot: ${errorMessage}`;
        }
    }
}
