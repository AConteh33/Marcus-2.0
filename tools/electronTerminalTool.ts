import type { Tool } from "./tool";
import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";

interface ExecuteCommandArgs {
  command: string;
}

export class ElectronTerminalTool implements Tool {
  getDeclaration(): FunctionDeclaration {
    return {
      name: "executeTerminalCommand",
      description: "Execute terminal commands directly in Electron app. Commands are executed natively without requiring external server.",
      parameters: {
        type: Type.OBJECT,
        description: "Terminal command execution parameters",
        properties: {
          command: { 
            type: Type.STRING, 
            description: "The terminal command to execute" 
          }
        },
        required: ["command"]
      }
    };
  }

  async execute(args: ExecuteCommandArgs): Promise<string> {
    const { command } = args;
    
    try {
      // Check if we're in Electron environment
      if (typeof window !== 'undefined' && window.electronAPI) {
        // Use Electron's built-in terminal
        const result = await window.electronAPI.executeTerminal(command);
        
        if (result.success && result.output) {
          return result.output;
        } else {
          return result.error || `Failed to execute command: ${command}`;
        }
      } else {
        // Fallback to external terminal server (for web version)
        const response = await fetch('http://localhost:3001/api/terminal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ command }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          return `Terminal server error: ${errorData.error || 'Failed to execute command'}. Please start the terminal server in Electron app.`;
        }

        const data = await response.json();
        return data.output || 'Command executed successfully';
      }
    } catch (error) {
      return `Failed to execute terminal command: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}
