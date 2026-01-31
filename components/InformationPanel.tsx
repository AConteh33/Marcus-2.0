
import React from 'react';
import type { Note, Appointment, CalendarEvent, Language } from '../types';
import { translations } from '../constants';
import { NoteIcon, AppointmentIcon, PanelToggleIcon } from './Icons';
// import { BackgroundAITasks } from './BackgroundAITasks'; // Removed - Background AI functionality removed
import { ActiveToolDisplay } from './ActiveToolDisplay';

interface ToolUsage {
    toolName: string;
    startTime: Date;
    status: 'executing' | 'completed' | 'error';
    result?: string;
    error?: string;
}

interface InformationPanelProps {
  notes: Note[];
  appointments: Appointment[];
  calendarEvents: CalendarEvent[];
  lang: Language;
  onToggle: () => void;
  onDownloadPdf: () => void;
  isDataAvailable: boolean;
  onLanguageToggle: () => void;
  activeToolUsage?: ToolUsage | null;
}

const InfoCard: React.FC<{ children: React.ReactNode; icon: React.ReactNode; title: string; lang: Language }> = ({ children, icon, title, lang }) => (
    <div className="bg-gray-900/80 border border-amber-500/30 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex items-center mb-3">
            <div className={`text-amber-600 ${lang === 'ar' ? 'ml-3' : 'mr-3'}`}>{icon}</div>
            <h3 className="text-lg font-semibold text-amber-400">{title}</h3>
        </div>
        <div className="space-y-2">{children}</div>
    </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <p className="text-sm text-amber-600 italic">{message}</p>
);

export const InformationPanel: React.FC<InformationPanelProps> = ({ notes, appointments, calendarEvents, lang, onToggle, onDownloadPdf, isDataAvailable, onLanguageToggle, activeToolUsage }) => {
  const t = translations[lang];

  return (
    <div className="w-full h-full flex flex-col" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="p-4 flex justify-between items-center shrink-0">
          <button
              onClick={onLanguageToggle}
              className="px-4 py-1.5 text-sm font-semibold bg-gray-900/80 border border-amber-500/30 rounded-full text-amber-400 hover:bg-amber-500/20 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
              aria-label={`Switch to ${lang === 'en' ? 'Arabic' : 'English'}`}
          >
              {t.languageToggle}
          </button>
          <button
              onClick={onToggle}
              className="p-1.5 text-amber-600 hover:text-amber-800 rounded-full hover:bg-amber-500/20 focus:outline-none focus:ring-2 focus:ring-amber-400"
              aria-label="Collapse panel"
          >
              <PanelToggleIcon className="w-6 h-6" isPanelVisible={true} />
          </button>
      </div>
      <div className="px-4 pb-4 space-y-4 flex-grow overflow-y-auto">
        <ActiveToolDisplay toolUsage={activeToolUsage} />
        {/* BackgroundAITasks component removed - Background AI functionality removed */}
        <InfoCard title={t.notes} icon={<NoteIcon className="w-6 h-6" />} lang={lang}>
          {notes.length > 0 ? (
            notes.map(note => (
              <div key={note.id} className={`bg-gray-800/80 p-2.5 rounded-md ${lang === 'ar' ? 'border-r-4' : 'border-l-4'} border-amber-500`}>
                <p className="font-bold text-amber-300 text-sm">{note.title}</p>
                <p className="text-gray-300 text-sm mt-1">{note.content}</p>
              </div>
            ))
          ) : (
            <EmptyState message={t.noNotes} />
          )}
        </InfoCard>

        <InfoCard title={t.appointments} icon={<AppointmentIcon className="w-6 h-6" />} lang={lang}>
          {appointments.length > 0 ? (
            appointments.map(appt => (
              <div key={appt.id} className={`bg-gray-50/80 p-2.5 rounded-md ${lang === 'ar' ? 'border-r-4' : 'border-l-4'} border-amber-500`}>
                <p className="font-bold text-amber-800 text-sm">{appt.title}</p>
                <p className="text-xs text-gray-600">{appt.date} at {appt.time}</p>
              </div>
            ))
          ) : (
            <EmptyState message={t.noAppointments} />
          )}
        </InfoCard>

        <InfoCard title={t.calendarEvents} icon={<AppointmentIcon className="w-6 h-6" />} lang={lang}>
          {calendarEvents.length > 0 ? (
            calendarEvents.map(event => (
              <div key={event.id} className={`bg-gray-50/80 p-2.5 rounded-md ${lang === 'ar' ? 'border-r-4' : 'border-l-4'} border-amber-500`}>
                <p className="font-bold text-amber-800 text-sm">{event.title}</p>
                <p className="text-xs text-gray-600">{event.date} at {event.time}</p>
              </div>
            ))
          ) : (
          <EmptyState message={t.noEvents} />
          )}
        </InfoCard>
      </div>
      <div className="p-4 border-t border-amber-500/20 shrink-0">
          <button
            onClick={onDownloadPdf}
            disabled={!isDataAvailable}
            className="w-full bg-amber-600/80 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-amber-500 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {t.downloadPdf}
          </button>
      </div>
    </div>
  );
};
