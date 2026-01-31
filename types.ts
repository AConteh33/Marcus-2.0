
export interface Note {
  id: string;
  title: string;
  content: string;
}

export interface Appointment {
  id:string;
  title: string;
  date: string;
  time: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
}

export interface Transcript {
  id: string;
  speaker: 'user' | 'ai';
  text: string;
}

export interface ThoughtProcess {
  id: string;
  timestamp: Date;
  type: 'thinking' | 'planning' | 'executing' | 'observing';
  content: string;
  step?: number;
  totalSteps?: number;
}

export interface ToolUsage {
  toolName: string;
  startTime: Date;
  status: 'executing' | 'completed' | 'error';
  result?: string;
  error?: string;
}

export type Language = 'en' | 'ar';