import type { Tool } from './tool';
import { SystemChecker } from '../utils/systemChecker';
import { FunctionDeclaration, Type } from "@google/genai";

interface SystemStatusArgs {
    check?: 'all' | 'puppeteer' | 'install-puppeteer';
}

export class SystemStatusTool implements Tool {
    private systemChecker: SystemChecker;

    constructor() {
        this.systemChecker = new SystemChecker();
    }

    getDeclaration(): FunctionDeclaration {
        return {
            name: "systemStatus",
            description: "Check system status and availability of tools like Puppeteer. Can also install Puppeteer if needed.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    check: {
                        type: Type.STRING,
                        enum: ["all", "puppeteer", "install-puppeteer"],
                        description: "What to check: all (complete system status), puppeteer (Puppeteer availability only), install-puppeteer (install Puppeteer if not available)"
                    }
                },
                required: []
            }
        };
    }

    async execute(args: SystemStatusArgs): Promise<string> {
        try {
            const { check = 'all' } = args;

            switch (check) {
                case 'all':
                    const status = await this.systemChecker.checkSystemStatus();
                    return this.systemChecker.generateStatusReport(status);
                
                case 'puppeteer':
                    const puppeteerStatus = await this.systemChecker.checkPuppeteerOnly();
                    if (puppeteerStatus.installed) {
                        return `✅ **Puppeteer Status**: Installed and ready to use\n📦 **Version**: ${puppeteerStatus.version}\n🚀 **Browser Automation**: Available`;
                    } else {
                        return `❌ **Puppeteer Status**: Not installed\n⚠️ **Browser Automation**: Not available\n💡 **To install**: Use systemStatus with check "install-puppeteer" or run puppeteerTerminal with command "install"`;
                    }
                
                case 'install-puppeteer':
                    return await this.systemChecker.installPuppeteerIfNeeded();
                
                default:
                    return `Error: Unknown check type "${check}"`;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('System status error:', errorMessage);
            return `Error checking system status: ${errorMessage}`;
        }
    }
}
