import type { Tool } from './tool';
import { FunctionDeclaration, Type } from "@google/genai";

interface ProductivityToolsArgs {
    action: 'google-meet' | 'create-note' | 'read-note' | 'list-notes' | 'delete-note' | 'search-notes' | 'set-alarm' | 'list-alarms' | 'cancel-alarms' | 'test-alarm' | 'start-marcus' | 'check-marcus' | 'ensure-marcus';
    title?: string;
    content?: string;
    keyword?: string;
    time?: string;
    message?: string;
    autoStart?: string;
}

export class ProductivityTools implements Tool {
    private scriptPath: string;

    constructor() {
        this.scriptPath = '/Users/ace/CascadeProjects/Marcus 1.9/scripts';
    }

    private async executeCommand(command: string): Promise<string> {
        try {
            // Try Electron API first
            if (typeof window !== 'undefined' && window.electronAPI) {
                return await window.electronAPI.executeTerminal(command);
            }
            
            // Fallback to fetch for web environment
            const response = await fetch('http://localhost:3001/api/terminal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ command }),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.output || 'Command executed successfully';
        } catch (error) {
            return `Failed to execute command: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    getDeclaration(): FunctionDeclaration {
        return {
            name: "productivityTools",
            description: "Productivity suite for Google Meet creation, notes management, alarm scheduling, and Marcus app automation. Create meetings, manage desktop notes, set alarms with auto-start, and control Marcus application.",
            parameters: {
                type: Type.OBJECT,
                description: "Productivity suite for Google Meet creation, notes management, alarm scheduling, and Marcus app automation. Create meetings, manage desktop notes, set alarms with auto-start, and control Marcus application.",
                properties: {
                    action: {
                        type: Type.STRING,
                        enum: ["google-meet", "set-alarm", "list-alarms", "cancel-alarms", "test-alarm", "start-marcus", "check-marcus", "ensure-marcus"],
                        description: "Action to perform"
                    },
                    time: {
                        type: Type.STRING,
                        description: "Alarm time in HH:MM format"
                    },
                    message: {
                        type: Type.STRING,
                        description: "Alarm message"
                    },
                    autoStart: {
                        type: Type.STRING,
                        enum: ["yes", "no"],
                        description: "Whether to auto-start Marcus when alarm triggers"
                    }
                },
                required: ["action"]
            }
        };
    }

    async execute(args: ProductivityToolsArgs): Promise<string> {
        try {
            const { action, time, message, autoStart } = args;

            switch (action) {
                case 'google-meet':
                    return await this.createGoogleMeet();
                case 'set-alarm':
                    return await this.setAlarm(time, message, autoStart);
                case 'list-alarms':
                    return await this.listAlarms();
                case 'cancel-alarms':
                    return await this.cancelAlarms();
                case 'test-alarm':
                    return await this.testAlarm();
                case 'start-marcus':
                    return await this.startMarcus();
                case 'check-marcus':
                    return await this.checkMarcus();
                case 'ensure-marcus':
                    return await this.ensureMarcus();
                default:
                    return "❌ Unknown action. Available actions: google-meet, set-alarm, list-alarms, cancel-alarms, test-alarm, start-marcus, check-marcus, ensure-marcus";
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Productivity tools error:', errorMessage);
            return `❌ Error executing productivity tool: ${errorMessage}`;
        }
    }

    private async createGoogleMeet(): Promise<string> {
        try {
            const command = `cd "${this.scriptPath}" && node google-meet-automation.js`;
            const result = await this.executeCommand(command);
            return `🎥 **Google Meet Creation**:\n${result}`;
        } catch (error) {
            return `❌ Error creating Google Meet: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    private async createNote(title: string, content: string): Promise<string> {
        if (!title || !content) {
            return "❌ Title and content are required for creating notes";
        }

        try {
            const command = `"${this.scriptPath}/notes-manager.sh" create "${title}" "${content}"`;
            const result = await this.executeCommand(command);
            return `📝 **Note Created**:\n${result}`;
        } catch (error) {
            return `❌ Error creating note: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    private async readNote(title: string): Promise<string> {
        if (!title) {
            return "❌ Title is required for reading notes";
        }

        try {
            const command = `"${this.scriptPath}/notes-manager.sh" read "${title}"`;
            const result = await this.executeCommand(command);
            return `📄 **Note Content**:\n${result}`;
        } catch (error) {
            return `❌ Error reading note: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    private async listNotes(): Promise<string> {
        try {
            const command = `"${this.scriptPath}/notes-manager.sh" list`;
            const result = await this.executeCommand(command);
            return `📋 **All Notes**:\n${result}`;
        } catch (error) {
            return `❌ Error listing notes: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    private async deleteNote(title: string): Promise<string> {
        if (!title) {
            return "❌ Title is required for deleting notes";
        }

        try {
            const command = `"${this.scriptPath}/notes-manager.sh" delete "${title}"`;
            const result = await this.executeCommand(command);
            return `🗑️ **Note Deleted**:\n${result}`;
        } catch (error) {
            return `❌ Error deleting note: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    private async searchNotes(keyword: string): Promise<string> {
        if (!keyword) {
            return "❌ Keyword is required for searching notes";
        }

        try {
            const command = `"${this.scriptPath}/notes-manager.sh" search "${keyword}"`;
            const result = await this.executeCommand(command);
            return `🔍 **Search Results**:\n${result}`;
        } catch (error) {
            return `❌ Error searching notes: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    private async setAlarm(time: string, message: string, autoStart: string): Promise<string> {
        if (!time || !message) {
            return "❌ Time and message are required for setting alarms";
        }

        try {
            const command = `"${this.scriptPath}/alarm-scheduler.sh" set "${time}" "${message}" "${autoStart}"`;
            const result = await this.executeCommand(command);
            return `⏰ **Alarm Set**:\n${result}`;
        } catch (error) {
            return `❌ Error setting alarm: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    private async listAlarms(): Promise<string> {
        try {
            const command = `"${this.scriptPath}/alarm-scheduler.sh" list`;
            const result = await this.executeCommand(command);
            return `⏰ **Active Alarms**:\n${result}`;
        } catch (error) {
            return `❌ Error listing alarms: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    private async cancelAlarms(): Promise<string> {
        try {
            const command = `"${this.scriptPath}/alarm-scheduler.sh" cancel`;
            const result = await this.executeCommand(command);
            return `🗑️ **Alarms Canceled**:\n${result}`;
        } catch (error) {
            return `❌ Error canceling alarms: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    private async testAlarm(): Promise<string> {
        try {
            const command = `"${this.scriptPath}/alarm-scheduler.sh" test`;
            const result = await this.executeCommand(command);
            return `🔔 **Alarm Test**:\n${result}`;
        } catch (error) {
            return `❌ Error testing alarm: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    private async startMarcus(): Promise<string> {
        try {
            const command = `cd "${this.scriptPath}" && node marcus-auto-start.js start`;
            const result = await this.executeCommand(command);
            return `🚀 **Marcus Started**:\n${result}`;
        } catch (error) {
            return `❌ Error starting Marcus: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    private async checkMarcus(): Promise<string> {
        try {
            const command = `cd "${this.scriptPath}" && node marcus-auto-start.js check`;
            const result = await this.executeCommand(command);
            return `📱 **Marcus Status**:\n${result}`;
        } catch (error) {
            return `❌ Error checking Marcus: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    private async ensureMarcus(): Promise<string> {
        try {
            const command = `cd "${this.scriptPath}" && node marcus-auto-start.js ensure`;
            const result = await this.executeCommand(command);
            return `🔄 **Marcus Ensure Running**:\n${result}`;
        } catch (error) {
            return `❌ Error ensuring Marcus: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
}
