// Fix: Add React import to resolve namespace error for React types.
import * as React from 'react';
import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import type { Note } from "../types";
import type { Tool } from "./tool";

export class SaveNoteTool implements Tool {
    private readonly onNoteSaved: () => void;

    constructor(onNoteSaved: () => void) {
        this.onNoteSaved = onNoteSaved;
    }

    getDeclaration(): FunctionDeclaration {
        return {
            name: 'saveNote',
            parameters: {
                type: Type.OBJECT,
                description: 'Saves a note with a title and content.',
                properties: {
                    title: { type: Type.STRING, description: 'The title of the note.' },
                    content: { type: Type.STRING, description: 'The content of the note.' }
                },
                required: ['title', 'content']
            }
        };
    }

    async execute(args: { title: string; content: string }): Promise<string> {
        try {
            // Get existing data from sessionStorage
            const data = JSON.parse(sessionStorage.getItem('side_panel_data') || '{"notes":[],"appointments":[],"calendarEvents":[]}');
            
            // Add new note
            const newNote: Note = {
                id: crypto.randomUUID(),
                title: args.title,
                content: args.content
            };
            
            data.notes.push(newNote);
            
            // Save to sessionStorage
            sessionStorage.setItem('side_panel_data', JSON.stringify(data));
            
            // Trigger callback
            this.onNoteSaved();
            
            return `Note saved: "${args.title}"`;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Save note error:', errorMessage);
            return `Failed to save note: ${errorMessage}`;
        }
    }
}
