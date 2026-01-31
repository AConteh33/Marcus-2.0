// Fix: Add React import to resolve namespace error for React types.
import * as React from 'react';
import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import type { CalendarEvent } from "../types";
import type { Tool } from "./tool";

export class UpdateCalendarEventTool implements Tool {
    private readonly calendarEvents: CalendarEvent[];
    private readonly setCalendarEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;

    constructor(calendarEvents: CalendarEvent[], setCalendarEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>) {
        this.calendarEvents = calendarEvents;
        this.setCalendarEvents = setCalendarEvents;
    }

    getDeclaration(): FunctionDeclaration {
        return {
            name: 'updateCalendarEvent',
            parameters: {
                type: Type.OBJECT,
                description: 'Updates an existing calendar event. Use this when the user wants to modify, edit, change, or reschedule a calendar event they previously saved.',
                properties: {
                    eventId: { 
                        type: Type.STRING, 
                        description: 'The ID of the calendar event to update. If you don\'t know the ID, use getCalendarEvents first to find it.' 
                    },
                    title: { 
                        type: Type.STRING, 
                        description: 'The new title for the event. If not provided, the existing title will be kept.' 
                    },
                    date: { 
                        type: Type.STRING, 
                        description: 'The new date for the event (e.g., "November 10th, 2025"). If not provided, the existing date will be kept.' 
                    },
                    time: { 
                        type: Type.STRING, 
                        description: 'The new time for the event (e.g., "3:00 PM"). If not provided, the existing time will be kept.' 
                    }
                },
                required: ['eventId']
            }
        };
    }

    async execute(args: { eventId: string; title?: string; date?: string; time?: string }): Promise<string> {
        if (!args.eventId) {
            return "Error: Event ID is required to update a calendar event.";
        }

        const eventIndex = this.calendarEvents.findIndex(e => e.id === args.eventId);
        if (eventIndex === -1) {
            return `Error: Calendar event with ID "${args.eventId}" not found. Use getCalendarEvents to see available events.`;
        }

        const updatedEvent: CalendarEvent = {
            ...this.calendarEvents[eventIndex],
            title: args.title !== undefined ? args.title : this.calendarEvents[eventIndex].title,
            date: args.date !== undefined ? args.date : this.calendarEvents[eventIndex].date,
            time: args.time !== undefined ? args.time : this.calendarEvents[eventIndex].time
        };

        const updatedEvents = [...this.calendarEvents];
        updatedEvents[eventIndex] = updatedEvent;
        this.setCalendarEvents(updatedEvents);

        return `Calendar event "${updatedEvent.title}" has been updated successfully.`;
    }
}

