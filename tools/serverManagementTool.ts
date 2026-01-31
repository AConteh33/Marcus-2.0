import type { Tool } from "./tool";
import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";

interface ServerManagementArgs {
  action: 'check' | 'start' | 'restart' | 'status';
  server: 'terminal';
}

export class ServerManagementTool implements Tool {
  getDeclaration(): FunctionDeclaration {
    return {
      name: "manageServers",
      description: "Check, start, or restart terminal server. Use when server is down or not responding.",
      parameters: {
        type: Type.OBJECT,
        description: "Server management parameters",
        properties: {
          action: { 
            type: Type.STRING, 
            description: "Action to perform: check, start, restart, or status",
            enum: ["check", "start", "restart", "status"]
          },
          server: {
            type: Type.STRING,
            description: "Which server to manage: terminal",
            enum: ["terminal"]
          }
        },
        required: ["action", "server"]
      }
    };
  }

  async execute(args: ServerManagementArgs): Promise<string> {
    const { action, server } = args;
    let results = [];

    try {
      // Terminal Server Management
      if (server === 'terminal') {
        const terminalResult = await this.manageTerminalServer(action);
        results.push(`Terminal Server: ${terminalResult}`);
      }

      return results.join('\n');

    } catch (error) {
      return `Server management failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  private async manageTerminalServer(action: string): Promise<string> {
    const terminalPort = 3001;
    const healthUrl = `http://localhost:${terminalPort}/api/health`;

    try {
      // Check if we're in deployed environment
      if (typeof window !== 'undefined') {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (!isLocalhost) {
          return `⚠️ Terminal server management is not available in the deployed web version.

**Terminal Server Status:**
- 🌐 **Deployed Environment**: Terminal server runs locally only
- 💻 **Local Development**: Full server management available
- 🔧 **Manual Setup**: Run locally for terminal access

**To manage terminal server:**
1. Download and run Marcus AI locally
2. Use \`node terminal-server.cjs\` to start the server
3. Access full terminal management features`;
        }
      }

      if (action === 'check' || action === 'status') {
        const response = await fetch(healthUrl);
        if (response.ok) {
          const data = await response.json();
          return `✅ Running (PID: ${data.pid || 'unknown'}, Uptime: ${data.uptime || 'unknown'})`;
        } else {
          return `❌ Not responding (HTTP ${response.status})`;
        }
      } else if (action === 'start' || action === 'restart') {
        // Kill existing process
        await this.executeCommand(`pkill -f "terminal-server" || true`);
        await this.executeCommand(`sleep 2`);
        
        // Start new server
        const startResult = await this.executeCommand(`cd "/Users/ace/CascadeProjects/Marcus 1.7" && node terminal-server.cjs > /dev/null 2>&1 & echo "Started with PID: $!"`);
        
        // Wait and verify
        await this.executeCommand(`sleep 3`);
        const checkResponse = await fetch(healthUrl);
        
        if (checkResponse.ok) {
          return `✅ Started successfully (${startResult.trim()})`;
        } else {
          return `❌ Failed to start - check logs`;
        }
      }
    } catch (error) {
      if (action === 'check' || action === 'status') {
        return `❌ Not running or not accessible`;
      } else {
        return `❌ ${action} failed: ${error instanceof Error ? error.message : String(error)}`;
      }
    }

    return "Unknown action";
  }

  private async manageBackgroundServer(action: string): Promise<string> {
    return `✅ Background AI functionality has been removed from the system`;
  }

  private async executeCommand(command: string): Promise<string> {
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      exec(command, (error: any, stdout: string, stderr: string) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }
}
