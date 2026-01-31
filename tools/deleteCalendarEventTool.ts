// Fix: Add React import to resolve namespace error for React types.
import * as React from 'react';
import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import type { CalendarEvent } from "../types";
import type { Tool } from "./tool";

export class DeleteCalendarEventTool implements Tool {
    private readonly calendarEvents: CalendarEvent[];
    private readonly setCalendarEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;

    constructor(calendarEvents: CalendarEvent[], setCalendarEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>) {
        this.calendarEvents = calendarEvents;
        this.setCalendarEvents = setCalendarEvents;
    }

    getDeclaration(): FunctionDeclaration {
        return {
            name: 'deleteCalendarEvent',
            parameters: {
                type: Type.OBJECT,
                description: 'Deletes a calendar event. Use this when the user wants to remove, delete, cancel, or erase a calendar event they previously saved.',
                properties: {
                    eventId: { 
                        type: Type.STRING, 
                        description: 'The ID of the calendar event to delete. If you don\'t know the ID, use getCalendarEvents first to find it.' 
                    }
                },
                required: ['eventId']
            }
        };
    }

    async execute(args: { eventId: string }): Promise<string> {
        if (!args.eventId) {
            return "Error: Event ID is required to delete a calendar event.";
        }

        const eventIndex = this.calendarEvents.findIndex(e => e.id === args.eventId);
        if (eventIndex === -1) {
            return `Error: Calendar event with ID "${args.eventId}" not found. Use getCalendarEvents to see available events.`;
        }

        const deletedEvent = this.calendarEvents[eventIndex];
        const updatedEvents = this.calendarEvents.filter(e => e.id !== args.eventId);
        this.setCalendarEvents(updatedEvents);

        return `Calendar event "${deletedEvent.title}" has been deleted successfully.`;
    }
}

