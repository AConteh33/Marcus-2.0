// Fix: Add React import to resolve namespace error for React types.
import * as React from 'react';
import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import type { Appointment } from "../types";
import type { Tool } from "./tool";

export class GetAppointmentsTool implements Tool {
    private readonly appointments: Appointment[];

    constructor(appointments: Appointment[]) {
        this.appointments = appointments;
    }

    getDeclaration(): FunctionDeclaration {
        return {
            name: 'getAppointments',
            parameters: {
                type: Type.OBJECT,
                description: 'Retrieves all saved appointments. Use this when the user asks to see their appointments, check their appointments, view their appointments, or list their appointments.',
                properties: {},
                required: []
            }
        };
    }

    async execute(args: {}): Promise<string> {
        if (this.appointments.length === 0) {
            return "You don't have any saved appointments yet.";
        }
        
        const appointmentsList = this.appointments.map((appointment, index) => 
            `${index + 1}. ID: ${appointment.id}\n   "${appointment.title}" - ${appointment.date} at ${appointment.time}`
        ).join('\n\n');
        
        return `You have ${this.appointments.length} saved appointment${this.appointments.length === 1 ? '' : 's'}:\n\n${appointmentsList}`;
    }
}

