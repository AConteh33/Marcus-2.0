// Fix: Add React import to resolve namespace error for React types.
import * as React from 'react';
import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import type { Note } from "../types";
import type { Tool } from "./tool";
import { ExecuteTerminalTool } from "./executeTerminalTool";

export class GetNotesTool implements Tool {
    private readonly terminalTool: ExecuteTerminalTool;

    constructor() {
        this.terminalTool = new ExecuteTerminalTool();
    }

    getDeclaration(): FunctionDeclaration {
        return {
            name: 'getNotes',
            parameters: {
                type: Type.OBJECT,
                description: 'Retrieves all saved notes. Use this when the user asks to see their notes, check what notes they have, view their notes, or list their notes.',
                properties: {},
                required: []
            }
        };
    }

    async execute(args: {}): Promise<string> {
        // Use terminal command to get notes from sessionStorage
        const command = `if (typeof sessionStorage !== 'undefined') {
            const saved = sessionStorage.getItem('side_panel_data');
            const data = saved ? JSON.parse(saved) : { notes: [], appointments: [], calendarEvents: [] };
            const notes = data.notes || [];
            
            if (notes.length === 0) {
                console.log('No notes found');
            } else {
                console.log('Found', notes.length, 'notes');
                notes.forEach((note, index) => {
                    console.log(\`\${index + 1}. ID: \${note.id}\`);
                    console.log(\`   Title: "\${note.title}"\`);
                    console.log(\`   Content: "\${note.content}"\`);
                });
            }
        }`;
        
        try {
            const result = await this.terminalTool.execute({ command });
            
            // Parse the result to format it properly
            if (result.includes('No notes found')) {
                return "You don't have any saved notes yet.";
            }
            
            // Extract notes from terminal output and format
            const lines = result.split('\n');
            const notes: any[] = [];
            let currentNote: any = null;
            
            for (const line of lines) {
                if (line.includes('. ID:')) {
                    if (currentNote) notes.push(currentNote);
                    currentNote = { id: line.split('ID: ')[1] };
                } else if (line.includes('Title:') && currentNote) {
                    currentNote.title = line.split('Title: "')[1].slice(0, -1);
                } else if (line.includes('Content:') && currentNote) {
                    currentNote.content = line.split('Content: "')[1].slice(0, -1);
                }
            }
            if (currentNote) notes.push(currentNote);
            
            if (notes.length === 0) {
                return "You don't have any saved notes yet.";
            }
            
            const notesList = notes.map((note, index) => 
                `${index + 1}. ID: ${note.id}\n   Title: "${note.title}"\n   Content: "${note.content}"`
            ).join('\n\n');
            
            return `You have ${notes.length} saved note${notes.length === 1 ? '' : 's'}:\n\n${notesList}`;
        } catch (error) {
            return `Failed to retrieve notes: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
}

