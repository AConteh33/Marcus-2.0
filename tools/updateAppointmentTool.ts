// Fix: Add React import to resolve namespace error for React types.
import * as React from 'react';
import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import type { Appointment } from "../types";
import type { Tool } from "./tool";

export class UpdateAppointmentTool implements Tool {
    private readonly appointments: Appointment[];
    private readonly setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;

    constructor(appointments: Appointment[], setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>) {
        this.appointments = appointments;
        this.setAppointments = setAppointments;
    }

    getDeclaration(): FunctionDeclaration {
        return {
            name: 'updateAppointment',
            parameters: {
                type: Type.OBJECT,
                description: 'Updates an existing appointment. Use this when the user wants to modify, edit, change, or reschedule an appointment they previously saved.',
                properties: {
                    appointmentId: { 
                        type: Type.STRING, 
                        description: 'The ID of the appointment to update. If you don\'t know the ID, use getAppointments first to find it.' 
                    },
                    title: { 
                        type: Type.STRING, 
                        description: 'The new title for the appointment. If not provided, the existing title will be kept.' 
                    },
                    date: { 
                        type: Type.STRING, 
                        description: 'The new date for the appointment (e.g., "November 5th, 2025"). If not provided, the existing date will be kept.' 
                    },
                    time: { 
                        type: Type.STRING, 
                        description: 'The new time for the appointment (e.g., "10:30 AM"). If not provided, the existing time will be kept.' 
                    }
                },
                required: ['appointmentId']
            }
        };
    }

    async execute(args: { appointmentId: string; title?: string; date?: string; time?: string }): Promise<string> {
        if (!args.appointmentId) {
            return "Error: Appointment ID is required to update an appointment.";
        }

        const appointmentIndex = this.appointments.findIndex(a => a.id === args.appointmentId);
        if (appointmentIndex === -1) {
            return `Error: Appointment with ID "${args.appointmentId}" not found. Use getAppointments to see available appointments.`;
        }

        const updatedAppointment: Appointment = {
            ...this.appointments[appointmentIndex],
            title: args.title !== undefined ? args.title : this.appointments[appointmentIndex].title,
            date: args.date !== undefined ? args.date : this.appointments[appointmentIndex].date,
            time: args.time !== undefined ? args.time : this.appointments[appointmentIndex].time
        };

        const updatedAppointments = [...this.appointments];
        updatedAppointments[appointmentIndex] = updatedAppointment;
        this.setAppointments(updatedAppointments);

        return `Appointment "${updatedAppointment.title}" has been updated successfully.`;
    }
}

