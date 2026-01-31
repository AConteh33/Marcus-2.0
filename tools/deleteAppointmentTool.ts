// Fix: Add React import to resolve namespace error for React types.
import * as React from 'react';
import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import type { Appointment } from "../types";
import type { Tool } from "./tool";

export class DeleteAppointmentTool implements Tool {
    private readonly appointments: Appointment[];
    private readonly setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;

    constructor(appointments: Appointment[], setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>) {
        this.appointments = appointments;
        this.setAppointments = setAppointments;
    }

    getDeclaration(): FunctionDeclaration {
        return {
            name: 'deleteAppointment',
            parameters: {
                type: Type.OBJECT,
                description: 'Deletes an appointment. Use this when the user wants to remove, delete, cancel, or erase an appointment they previously saved.',
                properties: {
                    appointmentId: { 
                        type: Type.STRING, 
                        description: 'The ID of the appointment to delete. If you don\'t know the ID, use getAppointments first to find it.' 
                    }
                },
                required: ['appointmentId']
            }
        };
    }

    async execute(args: { appointmentId: string }): Promise<string> {
        if (!args.appointmentId) {
            return "Error: Appointment ID is required to delete an appointment.";
        }

        const appointmentIndex = this.appointments.findIndex(a => a.id === args.appointmentId);
        if (appointmentIndex === -1) {
            return `Error: Appointment with ID "${args.appointmentId}" not found. Use getAppointments to see available appointments.`;
        }

        const deletedAppointment = this.appointments[appointmentIndex];
        const updatedAppointments = this.appointments.filter(a => a.id !== args.appointmentId);
        this.setAppointments(updatedAppointments);

        return `Appointment "${deletedAppointment.title}" has been deleted successfully.`;
    }
}

