// Fix: Add React import to resolve namespace error for React types.
import * as React from 'react';
import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import type { Appointment } from "../types";
import type { Tool } from "./tool";

export class SaveAppointmentTool implements Tool {
    private readonly onAppointmentSaved: () => void;

    constructor(onAppointmentSaved: () => void) {
        this.onAppointmentSaved = onAppointmentSaved;
    }

    getDeclaration(): FunctionDeclaration {
        return {
            name: 'saveAppointment',
            parameters: {
                type: Type.OBJECT,
                description: 'Saves an appointment with a title, date, and time.',
                properties: {
                    title: { type: Type.STRING, description: 'The title or purpose of the appointment.' },
                    date: { type: Type.STRING, description: 'The date of the appointment (e.g., "July 5th, 2024").' },
                    time: { type: Type.STRING, description: 'The time of the appointment (e.g., "10:30 AM").' }
                },
                required: ['title', 'date', 'time']
            }
        };
    }

    async execute(args: { title: string; date: string; time: string }): Promise<string> {
        try {
            if (!args.title || !args.date || !args.time) {
                return "Error: Title, date, and time are required to save an appointment.";
            }
            
            // Get existing data from sessionStorage
            const data = JSON.parse(sessionStorage.getItem('side_panel_data') || '{"notes":[],"appointments":[],"calendarEvents":[]}');
            
            // Add new appointment
            const newAppointment: Appointment = {
                id: crypto.randomUUID(),
                title: args.title,
                date: args.date,
                time: args.time
            };
            
            data.appointments = data.appointments || [];
            data.appointments.push(newAppointment);
            
            // Save to sessionStorage
            sessionStorage.setItem('side_panel_data', JSON.stringify(data));
            
            // Trigger callback
            this.onAppointmentSaved();
            
            return `Appointment saved: "${args.title}" on ${args.date} at ${args.time}`;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Save appointment error:', errorMessage);
            return `Failed to save appointment: ${errorMessage}`;
        }
    }
}
