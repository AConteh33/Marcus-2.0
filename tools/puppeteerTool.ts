import type { Tool } from './tool';
import { FunctionDeclaration, Type } from "@google/genai";

interface PuppeteerArgs {
    url?: string;
    action?: 'goto' | 'screenshot' | 'click' | 'type' | 'scroll' | 'wait' | 'evaluate' | 'close';
    selector?: string;
    text?: string;
    waitTime?: number;
    script?: string;
    outputPath?: string;
}

export class PuppeteerTool implements Tool {
    getDeclaration(): FunctionDeclaration {
        return {
            name: "puppeteer",
            description: "Automate web browser operations using Puppeteer - navigate websites, take screenshots, click elements, fill forms, extract data, and perform web scraping",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    url: {
                        type: Type.STRING,
                        description: "URL to navigate to (required for goto action)"
                    },
                    action: {
                        type: Type.STRING,
                        enum: ["goto", "screenshot", "click", "type", "scroll", "wait", "evaluate", "close"],
                        description: "Action to perform: goto (navigate), screenshot (capture page), click (click element), type (fill input), scroll (scroll page), wait (wait for time), evaluate (run JavaScript), close (close browser)"
                    },
                    selector: {
                        type: Type.STRING,
                        description: "CSS selector for element to interact with (for click, type actions)"
                    },
                    text: {
                        type: Type.STRING,
                        description: "Text to type into input field (for type action)"
                    },
                    waitTime: {
                        type: Type.NUMBER,
                        description: "Time to wait in milliseconds (for wait action)"
                    },
                    script: {
                        type: Type.STRING,
                        description: "JavaScript code to execute (for evaluate action)"
                    },
                    outputPath: {
                        type: Type.STRING,
                        description: "Path to save screenshot (for screenshot action, defaults to 'screenshot.png')"
                    }
                },
                required: ["action"]
            }
        };
    }

    async execute(args: PuppeteerArgs): Promise<string> {
        try {
            const response = await fetch('http://localhost:3002/puppeteer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(args)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.error) {
                return result.error;
            }
            
            return result.message || 'Operation completed successfully';
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            // Check if the server is not running
            if (errorMessage.includes('fetch') || errorMessage.includes('ECONNREFUSED')) {
                return 'Error: Puppeteer server is not running. Please start the puppeteer-server.cjs first using: node puppeteer-server.cjs';
            }
            
            console.error('Puppeteer error:', errorMessage);
            return `Error executing Puppeteer operation: ${errorMessage}`;
        }
    }
}
