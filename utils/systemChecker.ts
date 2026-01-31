import { ExecuteTerminalTool } from '../tools/executeTerminalTool';

export interface SystemStatus {
    puppeteer: {
        installed: boolean;
        version?: string;
        available: boolean;
    };
    node: {
        version: string;
        available: boolean;
    };
    npm: {
        version: string;
        available: boolean;
    };
}

export class SystemChecker {
    private terminalTool: ExecuteTerminalTool;

    constructor() {
        this.terminalTool = new ExecuteTerminalTool();
    }

    async checkSystemStatus(): Promise<SystemStatus> {
        const status: SystemStatus = {
            puppeteer: {
                installed: false,
                available: false
            },
            node: {
                version: '',
                available: false
            },
            npm: {
                version: '',
                available: false
            }
        };

        try {
            // Check Node.js
            try {
                const nodeVersion = await this.terminalTool.execute({
                    command: 'node --version'
                });
                status.node.version = nodeVersion.trim();
                status.node.available = true;
            } catch (error) {
                status.node.available = false;
            }

            // Check npm
            try {
                const npmVersion = await this.terminalTool.execute({
                    command: 'npm --version'
                });
                status.npm.version = npmVersion.trim();
                status.npm.available = true;
            } catch (error) {
                status.npm.available = false;
            }

            // Check Puppeteer
            try {
                const puppeteerCheck = await this.terminalTool.execute({
                    command: 'npm list puppeteer'
                });
                
                if (puppeteerCheck.includes('puppeteer@')) {
                    status.puppeteer.installed = true;
                    status.puppeteer.available = true;
                    
                    // Get version
                    try {
                        const versionResult = await this.terminalTool.execute({
                            command: 'node -e "try { const puppeteer = require(\'puppeteer\'); console.log(puppeteer.version || \'unknown\'); } catch(e) { console.log(\'unknown\'); }"'
                        });
                        status.puppeteer.version = versionResult.trim();
                    } catch (error) {
                        status.puppeteer.version = 'unknown';
                    }
                } else {
                    status.puppeteer.installed = false;
                    status.puppeteer.available = false;
                }
            } catch (error) {
                status.puppeteer.installed = false;
                status.puppeteer.available = false;
            }

        } catch (error) {
            console.error('System check error:', error);
        }

        return status;
    }

    async checkPuppeteerOnly(): Promise<{ installed: boolean; version?: string; available: boolean }> {
        try {
            const checkResult = await this.terminalTool.execute({
                command: 'npm list puppeteer'
            });
            
            if (checkResult.includes('puppeteer@')) {
                let version = 'unknown';
                try {
                    const versionResult = await this.terminalTool.execute({
                        command: 'node -e "try { const puppeteer = require(\'puppeteer\'); console.log(puppeteer.version || \'unknown\'); } catch(e) { console.log(\'unknown\'); }"'
                    });
                    version = versionResult.trim();
                } catch (error) {
                    // Version check failed
                }
                
                return {
                    installed: true,
                    version,
                    available: true
                };
            } else {
                return {
                    installed: false,
                    available: false
                };
            }
        } catch (error) {
            return {
                installed: false,
                available: false
            };
        }
    }

    generateStatusReport(status: SystemStatus): string {
        let report = '🔍 **System Status Report**\n\n';
        
        // Node.js status
        if (status.node.available) {
            report += `✅ **Node.js**: ${status.node.version}\n`;
        } else {
            report += `❌ **Node.js**: Not available\n`;
        }
        
        // npm status
        if (status.npm.available) {
            report += `✅ **npm**: ${status.npm.version}\n`;
        } else {
            report += `❌ **npm**: Not available\n`;
        }
        
        // Puppeteer status
        if (status.puppeteer.installed) {
            report += `✅ **Puppeteer**: Installed (v${status.puppeteer.version})\n`;
            report += `🚀 **Browser Automation**: Ready to use\n`;
        } else {
            report += `❌ **Puppeteer**: Not installed\n`;
            report += `⚠️ **Browser Automation**: Not available\n`;
            report += `💡 **To install**: Run puppeteerTerminal with command "install"\n`;
        }
        
        return report;
    }

    async installPuppeteerIfNeeded(): Promise<string> {
        const puppeteerStatus = await this.checkPuppeteerOnly();
        
        if (!puppeteerStatus.installed) {
            try {
                const installResult = await this.terminalTool.execute({
                    command: 'npm install puppeteer'
                });
                
                if (installResult.includes('error') || installResult.includes('ERR')) {
                    return '❌ Failed to install Puppeteer automatically. Please run: npm install puppeteer';
                }
                
                return '✅ Puppeteer installed successfully! Browser automation is now available.';
            } catch (error) {
                return `❌ Error installing Puppeteer: ${error}`;
            }
        } else {
            return `✅ Puppeteer is already installed (v${puppeteerStatus.version})`;
        }
    }
}
