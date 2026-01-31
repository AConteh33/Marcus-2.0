import type { FunctionDeclaration } from "@google/genai";
import type { Tool } from "./tool";

interface ToolUsage {
    toolName: string;
    startTime: Date;
    status: 'executing' | 'completed' | 'error';
    result?: string;
    error?: string;
}

export class ToolController {
    private tools: Map<string, Tool> = new Map();
    private currentToolUsage: ToolUsage | null = null;
    private onToolUsageChange?: (usage: ToolUsage | null) => void;

    /**
     * Set callback for tool usage changes
     */
    public setToolUsageCallback(callback: (usage: ToolUsage | null) => void): void {
        this.onToolUsageChange = callback;
    }

    /**
     * Registers a tool, making it available for the AI to use.
     * @param tool - The tool instance to register.
     */
    public register(tool: Tool): void {
        const name = tool.getDeclaration().name;
        if (this.tools.has(name)) {
            console.warn(`Tool with name "${name}" is already registered. Overwriting.`);
        }
        this.tools.set(name, tool);
    }

    /**
     * Retrieves all function declarations from the registered tools.
     * @returns An array of FunctionDeclaration objects.
     */
    public getDeclarations(): FunctionDeclaration[] {
        return Array.from(this.tools.values()).map(tool => tool.getDeclaration());
    }

    /**
     * Executes a tool by its name with the provided arguments.
     * @param name - The name of the tool to execute.
     * @param args - The arguments for the tool, provided by the AI.
     * @returns A promise that resolves with the string result of the tool's execution.
     */
    public async executeTool(name: string, args: any): Promise<string> {
        const tool = this.tools.get(name);
        if (!tool) {
            return `Error: Tool with name "${name}" not found.`;
        }

        // Start tracking tool usage
        this.currentToolUsage = {
            toolName: name,
            startTime: new Date(),
            status: 'executing'
        };
        this.notifyToolUsageChange();

        try {
            const result = await tool.execute(args);
            if (this.currentToolUsage) {
                this.currentToolUsage.status = 'completed';
                this.currentToolUsage.result = result;
                this.notifyToolUsageChange();
                
                // Clear tool usage after a delay
                setTimeout(() => {
                    this.currentToolUsage = null;
                    this.notifyToolUsageChange();
                }, 2000);
            }
            
            return result;
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            console.error(`Error executing tool "${name}":`, errorMessage);
            
            if (this.currentToolUsage) {
                this.currentToolUsage.status = 'error';
                this.currentToolUsage.error = errorMessage;
                this.notifyToolUsageChange();
                
                // Clear tool usage after a delay
                setTimeout(() => {
                    this.currentToolUsage = null;
                    this.notifyToolUsageChange();
                }, 2000);
            }
            
            return `Error: Failed to execute ${name}: ${errorMessage}`;
        }
    }

    /**
     * Get current tool usage
     */
    public getCurrentToolUsage(): ToolUsage | null {
        return this.currentToolUsage;
    }

    private notifyToolUsageChange(): void {
        if (this.onToolUsageChange) {
            this.onToolUsageChange(this.currentToolUsage);
        }
    }
}
