// Fix: Add React import to resolve namespace error for React types.
import * as React from 'react';
import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import type { CalendarEvent } from "../types";
import type { Tool } from "./tool";

export class SaveCalendarEventTool implements Tool {
    private readonly setCalendarEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
    private readonly onEventSaved: () => void;

    constructor(setCalendarEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>, onEventSaved: () => void) {
        this.setCalendarEvents = setCalendarEvents;
        this.onEventSaved = onEventSaved;
    }

    getDeclaration(): FunctionDeclaration {
        return {
            name: 'saveCalendarEvent',
            parameters: {
                type: Type.OBJECT,
                description: 'Saves a calendar event with a title, date, and time.',
                properties: {
                    title: { type: Type.STRING, description: 'The title of the calendar event.' },
                    date: { type: Type.STRING, description: 'The date of the event (e.g., "August 10th, 2024").' },
                    time: { type: Type.STRING, description: 'The time of the event (e.g., "3:00 PM").' }
                },
                required: ['title', 'date', 'time']
            }
        };
    }

    async execute(args: { title: string; date: string; time: string }): Promise<string> {
        if (!args.title || !args.date || !args.time) {
            return "Error: Title, date, and time are required to save a calendar event.";
        }
        const newEvent: CalendarEvent = {
            id: crypto.randomUUID(),
            title: args.title,
            date: args.date,
            time: args.time
        };
        this.setCalendarEvents(prev => [...prev, newEvent]);
        this.onEventSaved();
        return "Calendar event saved successfully.";
    }
}