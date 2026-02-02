// Fix: Add React import to resolve namespace error for React types.
import * as React from 'react';
import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import type { Note } from "../types";
import type { Tool } from "./tool";

export class GetNotesTool implements Tool {
    getDeclaration(): FunctionDeclaration {
        return {
            name: 'getNotes',
            description: 'Retrieves all saved notes from local storage.',
            parameters: {
                type: Type.OBJECT,
                properties: {},
                required: []
            }
        };
    }

    async execute(args: {}): Promise<string> {
        try {
            // Get data directly from sessionStorage
            const saved = sessionStorage.getItem('side_panel_data');
            const data = saved ? JSON.parse(saved) : { notes: [], appointments: [], calendarEvents: [] };
            const notes = data.notes || [];
            
            if (notes.length === 0) {
                return "You don't have any saved notes yet.";
            }
            
            const notesList = notes.map((note, index) => 
                `${index + 1}. Title: "${note.title}"\n   Content: "${note.content}"`
            ).join('\n\n');
            
            return `You have ${notes.length} saved note${notes.length === 1 ? '' : 's'}:\n\n${notesList}`;
        } catch (error) {
            return `Failed to retrieve notes: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
}

