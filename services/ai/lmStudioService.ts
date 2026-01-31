import { AIConversationService } from './aiService';

export class LMStudioService implements AIConversationService {
    private baseUrl: string;
    private model: string;
    private connected: boolean = false;

    constructor(baseUrl: string = 'http://localhost:1234', model: string = 'lfm2.5-1.2b-instruct') {
        this.baseUrl = baseUrl;
        this.model = model;
    }

    connect(options: any): void {
        throw new Error('LM Studio does not support real-time connections');
    }

    close(): void {
        this.connected = false;
        console.log('LM Studio disconnected');
    }

    sendText(text: string): void {
        if (!this.connected) {
            throw new Error('LM Studio not connected');
        }
        console.log('LM Studio text sent:', text);
    }

    sendAudio(audioBlob: any): void {
        if (!this.connected) {
            throw new Error('LM Studio not connected');
        }
        console.log('LM Studio audio sent (not supported)');
    }

    sendToolResponse(toolResponse: any): void {
        console.log('LM Studio tool response sent:', toolResponse);
    }

    async generateContent(prompt: string): Promise<string> {
        try {
            // First check system resources before processing
            const systemCheck = await fetch(`${this.baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: `You are Marcus, an AI assistant with FULL TERMINAL ACCESS. 

MANDATORY: Before ANY action, ALWAYS check current system resources and state:

1. CHECK SYSTEM: uname -a, whoami, pwd, date, ps aux | head -20, df -h, free -h
2. CHECK APPS: ls /Applications, which <appname>, osascript -e 'tell application "System Events" to get name of every process'
3. CHECK WINDOWS: osascript -e 'tell application "System Events" to get name of every window', wmctrl -l
4. CHECK FILES: ls -la, find . -name "*.txt" -o -name "*.md" | head -10
5. CHECK NETWORK: ping -c 3 google.com, netstat -an | head -10, curl -s ipinfo.io/ip
6. CHECK HARDWARE: system_profiler SPHardwareDataType | head -20, lscpu, lsblk

NEVER ASSUME - ALWAYS VERIFY with terminal commands first!`
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                })
            });

            const systemCheckResponse = await systemCheck.json();
            console.log('System check completed:', systemCheckResponse.choices[0]?.message?.content);

            const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: `You are Marcus, an AI assistant with terminal access. 

RULES:
- EXECUTE commands before talking about them
- SHOW REAL terminal output only
- BE HONEST about failures
- KEEP RESPONSES SHORT
- NO FAKE RESULTS
- REPORT SYSTEM ERRORS: If you see "500 Internal Server Error", "Connection refused", "ECONNREFUSED", or similar, acknowledge the system failure

FILE CREATION & OPTIONS:
- AFTER FILE CREATION: Always ask "Would you like me to open this file for you?"
- WHEN INFO NOT FOUND: Provide 1-3 clear options for user choice
- CLEAR DESCRIPTIONS: Briefly explain what each option contains

When you mention terminal commands, they will be executed. Use backticks for commands: \`ls -la\`

ERROR HANDLING:
- If terminal server returns 500 errors, say "Terminal server error detected"
- If connection is refused, say "Cannot connect to terminal server"
- If commands fail, show the exact error message
- If quota is exceeded (429, RESOURCE_EXHAUSTED), inform user immediately and suggest alternatives
- Always acknowledge system issues honestly`
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                })
            });

            const responseData = await response.json();
            
            if (responseData.choices && responseData.choices[0]) {
                return responseData.choices[0].message.content || 'No response';
            }

            return 'LM Studio processed your request.';
            
        } catch (error) {
            console.error('LM Studio generateContent error:', error);
            throw error;
        }
    }

    async checkConnection(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/v1/models`);
            this.connected = response.ok;
            return this.connected;
        } catch {
            this.connected = false;
            return false;
        }
    }

    isConnected(): boolean {
        return this.connected;
    }
}