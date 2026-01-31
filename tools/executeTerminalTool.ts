import type { Tool } from "./tool";
import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";

interface ExecuteCommandArgs {
  command: string;
}

export class ExecuteTerminalTool implements Tool {
  getDeclaration(): FunctionDeclaration {
    return {
      name: "executeTerminalCommand",
      description: "Execute a terminal command on the user's system. Commands are automatically translated for the current platform (macOS, Windows, Linux). Use this for system operations, file management, or any terminal task.",
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
      // Check if we're in a deployed environment
      if (typeof window !== 'undefined') {
        // Check if we're running locally vs deployed
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (isLocalhost) {
          // Local development - try to connect to local terminal server
          try {
            const response = await fetch('http://localhost:3001/api/terminal', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ command }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              return `Terminal server error: ${errorData.error || 'Failed to execute command'}. Please start the terminal server: \`node terminal-server.cjs\``;
            }

            const data = await response.json();
            return data.output || 'Command executed successfully';
          } catch (error) {
            return `⚠️ Terminal server not available locally. 

**🚀 Quick Setup Required:**
1. Download the terminal server: [Download terminal-server.cjs](/terminal-server-setup.html)
2. Run: \`node terminal-server.cjs\` in your terminal
3. Return here and try again!

**📋 Full Setup Guide:** [Visit Setup Page](/terminal-server-setup.html)

**Alternative:** I can provide the exact commands for you to run manually.`;
          }
        } else {
          // Deployed environment - provide alternatives
          return `⚠️ Terminal commands are not available in the deployed web version for security reasons.

**🚀 Get Full Terminal Access:**
- 💻 **Download Local Version**: [Setup Terminal Server](/terminal-server-setup.html)
- 📁 **File Operations**: Use the file management tools
- 🌐 **Web APIs**: Use browser-based APIs for web tasks
- 🔧 **Manual Commands**: I can provide the exact commands for you to run locally

**Command I would have executed:** \`${command}\`

**Quick Start:**
1. [Download terminal-server.cjs](/terminal-server-setup.html)
2. Run: \`node terminal-server.cjs\`
3. Enjoy full terminal access with Marcus AI!`;
        }
      }
      
      // Node.js environment (if running server-side)
      const { exec } = require('child_process');
      
      return new Promise((resolve) => {
        exec(command, (error: any, stdout: string, stderr: string) => {
          if (error) {
            resolve(`Error executing command: ${error.message}`);
          } else {
            const output = stdout || stderr || 'Command executed successfully';
            resolve(output.trim());
          }
        });
      });
    } catch (error) {
      return `Failed to execute terminal command: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}
