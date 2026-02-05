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
    private async executeCommand(command: string): Promise<string> {
        try {
            // Try Electron API first (same as productivityTools)
            if (typeof window !== 'undefined' && window.electronAPI) {
                return await window.electronAPI.executeTerminal(command);
            }
            
            // Fallback for browser environment
            return `Puppeteer command requires Electron environment: ${command}`;
        } catch (error) {
            return `Failed to execute Puppeteer command: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    getDeclaration(): FunctionDeclaration {
        return {
            name: "puppeteer",
            description: "Automate web browser operations for RESEARCH ONLY - navigate websites, take screenshots, extract data, and gather research information",
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
            const { url, action, selector, text, waitTime, script, outputPath } = args;

            switch (action) {
                case 'goto':
                    if (!url) return 'Error: URL required for goto action';
                    return await this.executeCommand(`cd /Users/ace/CascadeProjects\\ Marcus\\ 1.9 && node -e "
                        const puppeteer = require('puppeteer');
                        (async () => {
                            const browser = await puppeteer.launch({headless: false});
                            const page = await browser.newPage();
                            await page.goto('${url}');
                            await browser.close();
                        })();
                    "`);

                case 'screenshot':
                    const screenshotPath = outputPath || 'screenshot.png';
                    return await this.executeCommand(`cd /Users/ace/CascadeProjects\\ Marcus\\ 1.9 && node -e "
                        const puppeteer = require('puppeteer');
                        (async () => {
                            const browser = await puppeteer.launch({headless: false});
                            const page = await browser.newPage();
                            await page.screenshot({path: '${screenshotPath}', fullPage: true});
                            await browser.close();
                        })();
                    "`);

                case 'click':
                    if (!selector) return 'Error: Selector required for click action';
                    return await this.executeCommand(`cd /Users/ace/CascadeProjects\\ Marcus\\ 1.9 && node -e "
                        const puppeteer = require('puppeteer');
                        (async () => {
                            const browser = await puppeteer.launch({headless: false});
                            const page = await browser.newPage();
                            await page.goto('about:blank');
                            await page.waitForSelector('${selector}');
                            await page.click('${selector}');
                            await browser.close();
                        })();
                    "`);

                case 'type':
                    if (!selector || !text) return 'Error: Selector and text required for type action';
                    return await this.executeCommand(`cd /Users/ace/CascadeProjects\\ Marcus\\ 1.9 && node -e "
                        const puppeteer = require('puppeteer');
                        (async () => {
                            const browser = await puppeteer.launch({headless: false});
                            const page = await browser.newPage();
                            await page.goto('about:blank');
                            await page.waitForSelector('${selector}');
                            await page.type('${selector}', '${text}');
                            await browser.close();
                        })();
                    "`);

                case 'scroll':
                    return await this.executeCommand(`cd /Users/ace/CascadeProjects\\ Marcus\\ 1.9 && node -e "
                        const puppeteer = require('puppeteer');
                        (async () => {
                            const browser = await puppeteer.launch({headless: false});
                            const page = await browser.newPage();
                            await page.goto('about:blank');
                            await page.evaluate(() => window.scrollBy(0, 200));
                            await browser.close();
                        })();
                    "`);

                case 'wait':
                    const time = waitTime || 1000;
                    return await this.executeCommand(`sleep ${time}`);

                case 'evaluate':
                    if (!script) return 'Error: Script required for evaluate action';
                    return await this.executeCommand(`cd /Users/ace/CascadeProjects\\ Marcus\\ 1.9 && node -e "
                        const puppeteer = require('puppeteer');
                        (async () => {
                            const browser = await puppeteer.launch({headless: false});
                            const page = await browser.newPage();
                            await page.goto('about:blank');
                            const result = await page.evaluate(() => ${script});
                            console.log('Result:', result);
                            await browser.close();
                        })();
                    "`);

                case 'close':
                    return await this.executeCommand(`pkill -f puppeteer || true`);

                default:
                    return `Unknown action: ${action}. Available actions: goto, screenshot, click, type, scroll, wait, evaluate, close`;
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Puppeteer tool error:', errorMessage);
            return `Error executing Puppeteer operation: ${errorMessage}`;
        }
    }
}
