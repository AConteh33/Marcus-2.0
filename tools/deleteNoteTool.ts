// Fix: Add React import to resolve namespace error for React types.
import * as React from 'react';
import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import type { Note } from "../types";
import type { Tool } from "./tool";
import { ExecuteTerminalTool } from "./executeTerminalTool";

export class DeleteNoteTool implements Tool {
    private readonly terminalTool: ExecuteTerminalTool;

    constructor() {
        this.terminalTool = new ExecuteTerminalTool();
    }

    getDeclaration(): FunctionDeclaration {
        return {
            name: 'deleteNote',
            parameters: {
                type: Type.OBJECT,
                description: 'Deletes a note. Use this when the user wants to remove, delete, or erase a note they previously saved.',
                properties: {
                    noteId: { 
                        type: Type.STRING, 
                        description: 'The ID of the note to delete. If you don\'t know the ID, use getNotes first to find it, or search by title and provide the ID from the results.' 
                    }
                },
                required: ['noteId']
            }
        };
    }

    async execute(args: { noteId: string }): Promise<string> {
        if (!args.noteId) {
            return "Error: Note ID is required to delete a note.";
        }

        // Use terminal command to delete note from sessionStorage
        const command = `if (typeof sessionStorage !== 'undefined') {
            const saved = sessionStorage.getItem('side_panel_data');
            const data = saved ? JSON.parse(saved) : { notes: [], appointments: [], calendarEvents: [] };
            const notes = data.notes || [];
            
            const noteIndex = notes.findIndex(n => n.id === '${args.noteId}');
            if (noteIndex === -1) {
                console.log('Error: Note with ID "${args.noteId}" not found.');
                return;
            }
            
            const deletedNote = notes[noteIndex];
            notes.splice(noteIndex, 1);
            data.notes = notes;
            sessionStorage.setItem('side_panel_data', JSON.stringify(data));
            console.log('Note deleted successfully:', deletedNote.title);
        }`;
        
        try {
            const result = await this.terminalTool.execute({ command });
            if (result.includes('not found')) {
                return `Error: Note with ID "${args.noteId}" not found. Use getNotes to see available notes.`;
            }
            return `Note has been deleted successfully via terminal command.`;
        } catch (error) {
            return `Failed to delete note: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
}

