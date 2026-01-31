// Fix: Add React import to resolve namespace error for React types.
import * as React from 'react';
import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import type { Note } from "../types";
import type { Tool } from "./tool";
import { ExecuteTerminalTool } from "./executeTerminalTool";

export class UpdateNoteTool implements Tool {
    private readonly terminalTool: ExecuteTerminalTool;

    constructor() {
        this.terminalTool = new ExecuteTerminalTool();
    }

    getDeclaration(): FunctionDeclaration {
        return {
            name: 'updateNote',
            parameters: {
                type: Type.OBJECT,
                description: 'Updates an existing note. Use this when the user wants to modify, edit, or change a note they previously saved.',
                properties: {
                    noteId: { 
                        type: Type.STRING, 
                        description: 'The ID of the note to update. If you don\'t know the ID, use getNotes first to find it, or search by title and provide the ID from the results.' 
                    },
                    title: { 
                        type: Type.STRING, 
                        description: 'The new title for the note. If not provided, the existing title will be kept.' 
                    },
                    content: { 
                        type: Type.STRING, 
                        description: 'The new content for the note. If not provided, the existing content will be kept.' 
                    }
                },
                required: ['noteId']
            }
        };
    }

    async execute(args: { noteId: string; title?: string; content?: string }): Promise<string> {
        if (!args.noteId) {
            return "Error: Note ID is required to update a note.";
        }

        // Use terminal command to update note in sessionStorage
        const command = `if (typeof sessionStorage !== 'undefined') {
            const saved = sessionStorage.getItem('side_panel_data');
            const data = saved ? JSON.parse(saved) : { notes: [], appointments: [], calendarEvents: [] };
            const notes = data.notes || [];
            
            const noteIndex = notes.findIndex(n => n.id === '${args.noteId}');
            if (noteIndex === -1) {
                console.log('Error: Note with ID "${args.noteId}" not found.');
                return;
            }
            
            const updatedNote = {
                ...notes[noteIndex],
                title: ${args.title !== undefined ? `'${args.title}'` : 'notes[noteIndex].title'},
                content: ${args.content !== undefined ? `'${args.content}'` : 'notes[noteIndex].content'}
            };
            
            notes[noteIndex] = updatedNote;
            data.notes = notes;
            sessionStorage.setItem('side_panel_data', JSON.stringify(data));
            console.log('Note updated successfully:', updatedNote.title);
        }`;
        
        try {
            const result = await this.terminalTool.execute({ command });
            if (result.includes('not found')) {
                return `Error: Note with ID "${args.noteId}" not found. Use getNotes to see available notes.`;
            }
            return `Note has been updated successfully via terminal command.`;
        } catch (error) {
            return `Failed to update note: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
}

