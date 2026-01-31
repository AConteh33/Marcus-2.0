import type { Tool } from './tool';
import { ExecuteTerminalTool } from './executeTerminalTool';
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
    private terminalTool: ExecuteTerminalTool;
    private scriptPath: string;

    constructor() {
        this.terminalTool = new ExecuteTerminalTool();
        this.scriptPath = '/Users/ace/CascadeProjects/Marcus 1.9/scripts';
    }

    getDeclaration(): FunctionDeclaration {
        return {
            name: "productivityTools",
            description: "Productivity suite for Google Meet creation, notes management, alarm scheduling, and Marcus app automation. Create meetings, manage desktop notes, set alarms with auto-start, and control Marcus application.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    action: {
                        type: Type.STRING,
                        enum: ["google-meet", "create-note", "read-note", "list-notes", "delete-note", "search-notes", "set-alarm", "list-alarms", "cancel-alarms", "test-alarm", "start-marcus", "check-marcus", "ensure-marcus"],
                        description: "Action to perform"
                    },
                    title: {
                        type: Type.STRING,
                        description: "Note title or alarm identifier"
                    },
                    content: {
                        type: Type.STRING,
                        description: "Note content or alarm message"
                    },
                    keyword: {
                        type: Type.STRING,
                        description: "Keyword to search in notes"
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
            const { action, title, content, keyword, time, message, autoStart } = args;

            switch (action) {
                case 'google-meet':
                    return await this.createGoogleMeet();
                case 'create-note':
                    return await this.createNote(title, content);
                case 'read-note':
                    return await this.readNote(title);
                case 'list-notes':
                    return await this.listNotes();
                case 'delete-note':
                    return await this.deleteNote(title);
                case 'search-notes':
                    return await this.searchNotes(keyword);
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
                    return "❌ Unknown action. Available actions: google-meet, create-note, read-note, list-notes, delete-note, search-notes, set-alarm, list-alarms, cancel-alarms, test-alarm, start-marcus, check-marcus, ensure-marcus";
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
            const result = await this.terminalTool.execute({ command });
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
            const result = await this.terminalTool.execute({ command });
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
            const result = await this.terminalTool.execute({ command });
            return `📄 **Note Content**:\n${result}`;
        } catch (error) {
            return `❌ Error reading note: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    private async listNotes(): Promise<string> {
        try {
            const command = `"${this.scriptPath}/notes-manager.sh" list`;
            const result = await this.terminalTool.execute({ command });
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
            const result = await this.terminalTool.execute({ command });
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
            const result = await this.terminalTool.execute({ command });
            return `🔍 **Search Results**:\n${result}`;
        } catch (error) {
            return `❌ Error searching notes: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    private async setAlarm(time: string, message: string, autoStart: string = "no"): Promise<string> {
        if (!time || !message) {
            return "❌ Time and message are required for setting alarms";
        }

        try {
            const command = `"${this.scriptPath}/alarm-scheduler.sh" set "${time}" "${message}" "${autoStart}"`;
            const result = await this.terminalTool.execute({ command });
            return `⏰ **Alarm Set**:\n${result}`;
        } catch (error) {
            return `❌ Error setting alarm: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    private async listAlarms(): Promise<string> {
        try {
            const command = `"${this.scriptPath}/alarm-scheduler.sh" list`;
            const result = await this.terminalTool.execute({ command });
            return `⏰ **Active Alarms**:\n${result}`;
        } catch (error) {
            return `❌ Error listing alarms: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    private async cancelAlarms(): Promise<string> {
        try {
            const command = `"${this.scriptPath}/alarm-scheduler.sh" cancel`;
            const result = await this.terminalTool.execute({ command });
            return `🗑️ **Alarms Canceled**:\n${result}`;
        } catch (error) {
            return `❌ Error canceling alarms: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    private async testAlarm(): Promise<string> {
        try {
            const command = `"${this.scriptPath}/alarm-scheduler.sh" test`;
            const result = await this.terminalTool.execute({ command });
            return `🔔 **Alarm Test**:\n${result}`;
        } catch (error) {
            return `❌ Error testing alarm: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    private async startMarcus(): Promise<string> {
        try {
            const command = `cd "${this.scriptPath}" && node marcus-auto-start.js start`;
            const result = await this.terminalTool.execute({ command });
            return `🚀 **Marcus Started**:\n${result}`;
        } catch (error) {
            return `❌ Error starting Marcus: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    private async checkMarcus(): Promise<string> {
        try {
            const command = `cd "${this.scriptPath}" && node marcus-auto-start.js check`;
            const result = await this.terminalTool.execute({ command });
            return `📱 **Marcus Status**:\n${result}`;
        } catch (error) {
            return `❌ Error checking Marcus: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    private async ensureMarcus(): Promise<string> {
        try {
            const command = `cd "${this.scriptPath}" && node marcus-auto-start.js ensure`;
            const result = await this.terminalTool.execute({ command });
            return `🔄 **Marcus Ensure Running**:\n${result}`;
        } catch (error) {
            return `❌ Error ensuring Marcus: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
}
