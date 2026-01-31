// Marcus Auto-Start Script
// Automatically launches Marcus application when triggered

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

class MarcusAutoStart {
    constructor() {
        this.platform = os.platform();
        this.marcusPath = this.detectMarcusPath();
        this.logFile = path.join(os.homedir(), 'Desktop', 'marcus_auto_start.log');
    }

    detectMarcusPath() {
        const possiblePaths = [
            // Development paths
            path.join(os.homedir(), 'Desktop', 'Marcus 1.9'),
            path.join(os.homedir(), 'Documents', 'Marcus 1.9'),
            path.join(os.homedir(), 'Projects', 'Marcus 1.9'),
            
            // Production paths
            path.join(os.homedir(), 'Applications', 'Dera-tak Demo Assistant.app'),
            '/Applications/Dera-tak Demo Assistant.app',
            
            // Windows paths
            'C:\\Program Files\\Dera-tak Demo Assistant\\Dera-tak Demo Assistant.exe',
            'C:\\Program Files (x86)\\Dera-tak Demo Assistant\\Dera-tak Demo Assistant.exe'
        ];

        for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
                return possiblePath;
            }
        }

        return null;
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        console.log(logMessage.trim());
        
        // Write to log file
        try {
            fs.appendFileSync(this.logFile, logMessage);
        } catch (error) {
            console.error('Could not write to log file:', error.message);
        }
    }

    async startMarcus() {
        if (!this.marcusPath) {
            this.log('❌ Marcus application not found. Please ensure Marcus is installed.');
            return false;
        }

        this.log(`🚀 Starting Marcus application from: ${this.marcusPath}`);

        try {
            let command, args;

            if (this.platform === 'darwin') { // macOS
                if (this.marcusPath.endsWith('.app')) {
                    // macOS app bundle
                    command = 'open';
                    args = [this.marcusPath];
                } else {
                    // Development version
                    command = 'npm';
                    args = ['run', 'electron'];
                    process.chdir(this.marcusPath);
                }
            } else if (this.platform === 'win32') { // Windows
                if (this.marcusPath.endsWith('.exe')) {
                    // Windows executable
                    command = this.marcusPath;
                    args = [];
                } else {
                    // Development version
                    command = 'npm';
                    args = ['run', 'electron'];
                    process.chdir(this.marcusPath);
                }
            } else { // Linux and others
                if (this.marcusPath.endsWith('.exe')) {
                    command = this.marcusPath;
                    args = [];
                } else {
                    command = 'npm';
                    args = ['run', 'electron'];
                    process.chdir(this.marcusPath);
                }
            }

            // Start the process
            const child = spawn(command, args, {
                stdio: 'inherit',
                detached: true,
                shell: true
            });

            child.on('spawn', () => {
                this.log('✅ Marcus application started successfully');
                
                // Show notification
                this.showNotification('Marcus Started', 'Marcus application is now running');
            });

            child.on('error', (error) => {
                this.log(`❌ Failed to start Marcus: ${error.message}`);
            });

            child.on('exit', (code) => {
                this.log(`📱 Marcus application exited with code: ${code}`);
            });

            // Detach from parent process
            child.unref();

            return true;

        } catch (error) {
            this.log(`❌ Error starting Marcus: ${error.message}`);
            return false;
        }
    }

    showNotification(title, message) {
        try {
            if (this.platform === 'darwin') { // macOS
                exec(`osascript -e 'display notification "${message}" with title "${title}"'`);
            } else if (this.platform === 'linux') { // Linux
                exec(`notify-send "${title}" "${message}"`);
            } else if (this.platform === 'win32') { // Windows
                // Windows notification would require additional setup
                this.log(`🔔 ${title}: ${message}`);
            }
        } catch (error) {
            this.log(`Could not show notification: ${error.message}`);
        }
    }

    async checkIfRunning() {
        try {
            const platformCommands = {
                'darwin': 'ps aux | grep -i "dera-tak\\|marcus\\|electron.*main.cjs" | grep -v grep',
                'win32': 'tasklist | findstr /i "dera-tak marcus electron"',
                'linux': 'ps aux | grep -i "dera-tak\\|marcus\\|electron.*main.cjs" | grep -v grep'
            };

            const command = platformCommands[this.platform];
            
            return new Promise((resolve) => {
                exec(command, (error, stdout) => {
                    if (error) {
                        resolve(false);
                    } else {
                        resolve(stdout.trim().length > 0);
                    }
                });
            });
        } catch (error) {
            this.log(`Error checking if Marcus is running: ${error.message}`);
            return false;
        }
    }

    async ensureRunning() {
        const isRunning = await this.checkIfRunning();
        
        if (isRunning) {
            this.log('📱 Marcus application is already running');
            this.showNotification('Marcus Already Running', 'Marcus application is already active');
            return true;
        } else {
            return await this.startMarcus();
        }
    }
}

// Command line interface
async function main() {
    const action = process.argv[2];
    const autoStart = new MarcusAutoStart();

    switch (action) {
        case 'start':
            await autoStart.startMarcus();
            break;
        case 'check':
            const isRunning = await autoStart.checkIfRunning();
            console.log(isRunning ? '📱 Marcus is running' : '❌ Marcus is not running');
            break;
        case 'ensure':
            await autoStart.ensureRunning();
            break;
        case 'status':
            console.log(`Platform: ${autoStart.platform}`);
            console.log(`Marcus Path: ${autoStart.marcusPath || 'Not found'}`);
            console.log(`Log File: ${autoStart.logFile}`);
            break;
        default:
            console.log('Marcus Auto-Start Script');
            console.log('Usage: node marcus-auto-start.js {start|check|ensure|status}');
            console.log('');
            console.log('Commands:');
            console.log('  start   - Start Marcus application');
            console.log('  check   - Check if Marcus is running');
            console.log('  ensure  - Start Marcus if not already running');
            console.log('  status  - Show configuration status');
            break;
    }
}

// Export for use as module
module.exports = MarcusAutoStart;

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
