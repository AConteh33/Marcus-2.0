import type { Tool } from './tool';
import { ExecuteTerminalTool } from './executeTerminalTool';
import { FunctionDeclaration, Type } from "@google/genai";

interface PuppeteerTerminalArgs {
    command: 'install' | 'check' | 'version' | 'screenshot' | 'goto' | 'run-script';
    url?: string;
    outputPath?: string;
    script?: string;
    selector?: string;
    text?: string;
}

export class PuppeteerTerminalTool implements Tool {
    private terminalTool: ExecuteTerminalTool;

    constructor() {
        this.terminalTool = new ExecuteTerminalTool();
    }

    getDeclaration(): FunctionDeclaration {
        return {
            name: "puppeteerTerminal",
            description: "Control Puppeteer through terminal commands - install, check availability, take screenshots, navigate to websites, and run custom scripts",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    command: {
                        type: Type.STRING,
                        enum: ["install", "check", "version", "screenshot", "goto", "run-script"],
                        description: "Command to execute: install (install puppeteer), check (check if available), version (get version), screenshot (take screenshot), goto (navigate to url), run-script (execute custom script)"
                    },
                    url: {
                        type: Type.STRING,
                        description: "URL to navigate to (for goto and screenshot commands)"
                    },
                    outputPath: {
                        type: Type.STRING,
                        description: "Path to save screenshot (for screenshot command, defaults to 'terminal-screenshot.png')"
                    },
                    script: {
                        type: Type.STRING,
                        description: "JavaScript file path or inline script to execute (for run-script command)"
                    },
                    selector: {
                        type: Type.STRING,
                        description: "CSS selector for element interaction"
                    },
                    text: {
                        type: Type.STRING,
                        description: "Text to type into element"
                    }
                },
                required: ["command"]
            }
        };
    }

    async execute(args: PuppeteerTerminalArgs): Promise<string> {
        try {
            const { command, url, outputPath, script, selector, text } = args;

            switch (command) {
                case 'install':
                    return await this.installPuppeteer();
                
                case 'check':
                    return await this.checkPuppeteerAvailability();
                
                case 'version':
                    return await this.getPuppeteerVersion();
                
                case 'screenshot':
                    return await this.takeScreenshot(url, outputPath);
                
                case 'goto':
                    return await this.navigateToUrl(url);
                
                case 'run-script':
                    return await this.runScript(script, url);
                
                default:
                    return `Error: Unknown command "${command}"`;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Puppeteer terminal error:', errorMessage);
            return `Error executing Puppeteer terminal command: ${errorMessage}`;
        }
    }

    private async installPuppeteer(): Promise<string> {
        try {
            const installResult = await this.terminalTool.execute({
                command: 'npm install puppeteer'
            });
            
            if (installResult.includes('error') || installResult.includes('ERR')) {
                return 'Failed to install Puppeteer. You may need to run: npm install puppeteer --save';
            }
            
            return 'Puppeteer installed successfully! You can now use browser automation features.';
        } catch (error) {
            return `Error installing Puppeteer: ${error}`;
        }
    }

    private async checkPuppeteerAvailability(): Promise<string> {
        try {
            // Check if puppeteer is installed
            const checkResult = await this.terminalTool.execute({
                command: 'npm list puppeteer'
            });
            
            if (checkResult.includes('puppeteer@')) {
                const versionResult = await this.getPuppeteerVersion();
                return `✅ Puppeteer is available and ready to use!\n${versionResult}`;
            } else {
                return '❌ Puppeteer is not installed. Run puppeteerTerminal with command "install" to add it.';
            }
        } catch (error) {
            return '❌ Puppeteer is not available. Please install it first.';
        }
    }

    private async getPuppeteerVersion(): Promise<string> {
        try {
            const versionResult = await this.terminalTool.execute({
                command: 'node -e "try { const puppeteer = require(\'puppeteer\'); console.log(\'Puppeteer version:\', puppeteer.version || \'unknown\'); } catch(e) { console.log(\'Puppeteer not installed\'); }"'
            });
            
            return versionResult;
        } catch (error) {
            return 'Unable to get Puppeteer version';
        }
    }

    private async takeScreenshot(url?: string, outputPath?: string): Promise<string> {
        if (!url) {
            return 'Error: URL is required for screenshot command';
        }

        const screenshotFile = outputPath || 'terminal-screenshot.png';
        
        // Create a temporary script file
        const scriptContent = `
const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto('${url}', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: '${screenshotFile}', fullPage: true });
        await browser.close();
        console.log('Screenshot saved to: ${screenshotFile}');
    } catch (error) {
        console.error('Screenshot error:', error.message);
        process.exit(1);
    }
})();
`;

        try {
            // Write script to temporary file
            await this.terminalTool.execute({
                command: `echo '${scriptContent}' > temp-screenshot.js`
            });

            // Execute the script
            const result = await this.terminalTool.execute({
                command: `node temp-screenshot.js`
            });

            // Clean up
            await this.terminalTool.execute({
                command: 'rm -f temp-screenshot.js'
            });

            return result.includes('Screenshot saved') ? result : `Screenshot failed: ${result}`;
        } catch (error) {
            return `Error taking screenshot: ${error}`;
        }
    }

    private async navigateToUrl(url?: string): Promise<string> {
        if (!url) {
            return 'Error: URL is required for goto command';
        }

        const scriptContent = `
const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto('${url}', { waitUntil: 'networkidle2' });
        const title = await page.title();
        const url = page.url();
        await browser.close();
        console.log(\`Successfully navigated to: \${title} (\${url})\`);
    } catch (error) {
        console.error('Navigation error:', error.message);
        process.exit(1);
    }
})();
`;

        try {
            await this.terminalTool.execute({
                command: `echo '${scriptContent}' > temp-navigate.js`
            });

            const result = await this.terminalTool.execute({
                command: `node temp-navigate.js`
            });

            await this.terminalTool.execute({
                command: 'rm -f temp-navigate.js'
            });

            return result || 'Navigation completed';
        } catch (error) {
            return `Error navigating to URL: ${error}`;
        }
    }

    private async runScript(script?: string, url?: string): Promise<string> {
        if (!script) {
            return 'Error: Script is required for run-script command';
        }

        try {
            // Check if it's a file path or inline script
            const isFile = script.includes('/') || script.includes('\\') || script.endsWith('.js');
            
            if (isFile) {
                // Run script file
                const result = await this.terminalTool.execute({
                    command: `node ${script}`
                });
                return result;
            } else {
                // Run inline script
                const wrappedScript = `
const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        ${url ? `await page.goto('${url}', { waitUntil: 'networkidle2' });` : ''}
        ${script}
        await browser.close();
        console.log('Script executed successfully');
    } catch (error) {
        console.error('Script error:', error.message);
        process.exit(1);
    }
})();
`;

                await this.terminalTool.execute({
                    command: `echo '${wrappedScript}' > temp-script.js`
                });

                const result = await this.terminalTool.execute({
                    command: `node temp-script.js`
                });

                await this.terminalTool.execute({
                    command: 'rm -f temp-script.js'
                });

                return result || 'Script executed';
            }
        } catch (error) {
            return `Error running script: ${error}`;
        }
    }
}
