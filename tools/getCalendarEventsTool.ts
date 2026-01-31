// Fix: Add React import to resolve namespace error for React types.
import * as React from 'react';
import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import type { CalendarEvent } from "../types";
import type { Tool } from "./tool";

export class GetCalendarEventsTool implements Tool {
    private readonly calendarEvents: CalendarEvent[];

    constructor(calendarEvents: CalendarEvent[]) {
        this.calendarEvents = calendarEvents;
    }

    getDeclaration(): FunctionDeclaration {
        return {
            name: 'getCalendarEvents',
            parameters: {
                type: Type.OBJECT,
                description: 'Retrieves all saved calendar events. Use this when the user asks to see their calendar events, check their events, view their events, or list their events.',
                properties: {},
                required: []
            }
        };
    }

    async execute(args: {}): Promise<string> {
        if (this.calendarEvents.length === 0) {
            return "You don't have any saved calendar events yet.";
        }
        
        const eventsList = this.calendarEvents.map((event, index) => 
            `${index + 1}. ID: ${event.id}\n   "${event.title}" - ${event.date} at ${event.time}`
        ).join('\n\n');
        
        return `You have ${this.calendarEvents.length} saved calendar event${this.calendarEvents.length === 1 ? '' : 's'}:\n\n${eventsList}`;
    }
}

