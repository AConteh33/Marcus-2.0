import React, { useState, useMemo } from 'react';
import type { Note, Appointment, CalendarEvent, Language, ThoughtProcess, ToolUsage } from '../types';
import { translations } from '../constants';
import { soundEffects } from '../services/sound/soundEffects';

interface InformationPanelSciFiProps {
  notes: Note[];
  appointments: Appointment[];
  calendarEvents: CalendarEvent[];
  lang: Language;
  onToggle: () => void;
  onDownloadPdf: () => void;
  isDataAvailable: boolean;
  onLanguageToggle: (lang: Language) => void;
  activeToolUsage: ToolUsage[];
  thoughts: ThoughtProcess[];
  onClearThoughts: () => void;
  isElectron?: boolean;
  newItemsCount?: number;
}

interface SciFiCardProps {
  children: React.ReactNode; 
  icon: React.ReactNode; 
  title: string; 
  lang: Language;
  onClick?: () => void;
}

const SciFiCard: React.FC<SciFiCardProps> = ({ children, icon, title, lang, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    soundEffects.playClick();
    onClick?.();
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    soundEffects.playHover();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      className={`
        relative border border-yellow-500/30 rounded-lg p-4 backdrop-blur-sm transition-all duration-300
        ${isHovered ? 'bg-black/80 border-yellow-400/50 shadow-lg shadow-yellow-500/20' : 'bg-black/60'}
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow-500/50" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow-500/50" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow-500/50" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow-500/50" />
      
      <div className="flex items-center gap-3 mb-3">
        <div className="text-yellow-400">{icon}</div>
        <h3 className="text-yellow-300 font-mono text-sm uppercase tracking-wider">{title}</h3>
      </div>
      
      <div className="text-gray-300 font-mono text-sm">
        {children}
      </div>
    </div>
  );
};

const SciFiButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}> = ({ children, onClick, disabled = false, className = '' }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (!disabled) {
      soundEffects.playClick();
      onClick();
    }
  };

  const handleMouseEnter = () => {
    if (!disabled) {
      setIsHovered(true);
      soundEffects.playHover();
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <button
      className={`
        relative px-4 py-2 font-mono text-sm uppercase tracking-wider transition-all duration-300
        border border-yellow-500/50 rounded
        ${disabled 
          ? 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed' 
          : isHovered 
            ? 'bg-yellow-900/40 text-yellow-300 border-yellow-400 shadow-lg shadow-yellow-500/30' 
            : 'bg-gray-800/60 text-yellow-400 border-yellow-500/50'
        }
        ${className}
      `}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
    >
      {/* Button frame effect */}
      <div className="absolute inset-0 border border-yellow-500/20 rounded pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent rounded pointer-events-none" />
      
      {children}
    </button>
  );
};

const InformationPanelSciFi: React.FC<InformationPanelSciFiProps> = ({
  notes,
  appointments,
  calendarEvents,
  lang,
  onToggle,
  onDownloadPdf,
  isDataAvailable,
  onLanguageToggle,
  activeToolUsage,
  thoughts,
  onClearThoughts,
  isElectron = false,
  newItemsCount
}) => {
  const t = useMemo(() => translations[lang], [lang]);

  const handleDownloadPdf = () => {
    soundEffects.playProcessing();
    onDownloadPdf();
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'research': return '🔍';
      case 'analysis': return '📊';
      case 'generation': return '📝';
      case 'organization': return '📁';
      case 'editing': return '✏️';
      case 'fileops': return '📂';
      default: return '⚙️';
    }
  };

  const getTaskColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'running': return 'text-blue-400';
      case 'completed': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'cancelled': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const handleCancelTask = (taskId: string) => {
    soundEffects.playClick();
  };

  const handleClearThoughts = () => {
    soundEffects.playClick();
    onClearThoughts?.();
  };

  const handleLanguageToggle = () => {
    soundEffects.playClick();
    onLanguageToggle();
  };

  const getThoughtIcon = (type: ThoughtProcess['type']) => {
    switch (type) {
      case 'thinking': return '🤔';
      case 'planning': return '📋';
      case 'executing': return '⚡';
      case 'observing': return '👁️';
      default: return '💭';
    }
  };

  const getThoughtColor = (type: ThoughtProcess['type']) => {
    switch (type) {
      case 'thinking': return 'text-blue-400';
      case 'planning': return 'text-purple-400';
      case 'executing': return 'text-yellow-400';
      case 'observing': return 'text-cyan-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="h-full bg-black/90 backdrop-blur-md border-l border-yellow-500/20 p-4 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-yellow-300 font-mono text-lg uppercase tracking-wider">
            {t.systemPanel}
          </h2>
          <button
            className="text-yellow-400 hover:text-yellow-300 transition-colors duration-200"
            onMouseEnter={() => soundEffects.playHover()}
            onClick={() => {
              soundEffects.playClick();
              onToggle();
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Control buttons */}
        <div className="flex gap-2 mb-4">
          <SciFiButton onClick={handleLanguageToggle}>
            {lang === 'en' ? 'العربية' : 'English'}
          </SciFiButton>
          <SciFiButton onClick={handleDownloadPdf} disabled={!isDataAvailable}>
            {t.downloadPdf}
          </SciFiButton>
        </div>
      </div>

      {/* Active Tool Display */}
      {activeToolUsage && (
        <div className="mb-6">
          <h3 className="text-yellow-400 font-mono text-sm uppercase tracking-wider mb-3">
            Active Process
          </h3>
          <div className="border border-yellow-500/30 rounded-lg p-3 bg-black/40">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${
                activeToolUsage.status === 'executing' ? 'bg-yellow-400 animate-pulse' :
                activeToolUsage.status === 'completed' ? 'bg-green-400' : 'bg-red-400'
              }`} />
              <span className="text-yellow-300 font-mono text-sm">
                {activeToolUsage.toolName}
              </span>
            </div>
            <div className="text-gray-400 font-mono text-xs">
              Status: {activeToolUsage.status}
            </div>
          </div>
        </div>
      )}

      {/* Thinking Process */}
      {thoughts.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-yellow-400 font-mono text-sm uppercase tracking-wider">
              AI Thinking Process
            </h3>
            <button
              onClick={handleClearThoughts}
              className="text-xs text-gray-400 hover:text-yellow-400 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {thoughts.slice().reverse().map((thought, index) => (
              <div key={thought.id} className="border border-yellow-500/20 rounded p-2 bg-black/40">
                <div className="flex items-start gap-2">
                  <span className="text-lg">{getThoughtIcon(thought.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-mono uppercase ${getThoughtColor(thought.type)}`}>
                        {thought.type}
                      </span>
                      {thought.step && thought.totalSteps && (
                        <span className="text-xs text-gray-500">
                          {thought.step}/{thought.totalSteps}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(thought.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-gray-300 text-xs font-mono break-words">
                      {thought.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Cards */}
      <div className="space-y-4">
        <SciFiCard
          icon={<div className="w-4 h-4 border border-yellow-400 rounded" />}
          title={`${t.notes} (${notes.length})`}
          lang={lang}
        >
          {notes.length === 0 ? (
            <div className="text-gray-500 italic">{t.noNotes}</div>
          ) : (
            <div className="space-y-2">
              {notes.slice(0, 3).map((note, index) => (
                <div key={index} className="border-b border-yellow-500/20 pb-2 last:border-b-0">
                  <div className="text-yellow-200 text-xs">
                    {new Date(note.timestamp).toLocaleDateString()}
                  </div>
                  <div className="text-gray-300 text-sm mt-1 line-clamp-2">
                    {note.content}
                  </div>
                </div>
              ))}
              {notes.length > 3 && (
                <div className="text-yellow-400 text-xs">
                  +{notes.length - 3} more...
                </div>
              )}
            </div>
          )}
        </SciFiCard>

        <SciFiCard
          icon={<div className="w-4 h-4 border border-yellow-400 rounded-full" />}
          title={`${t.appointments} (${appointments.length})`}
          lang={lang}
        >
          {appointments.length === 0 ? (
            <div className="text-gray-500 italic">{t.noAppointments}</div>
          ) : (
            <div className="space-y-2">
              {appointments.slice(0, 3).map((apt, index) => (
                <div key={index} className="border-b border-yellow-500/20 pb-2 last:border-b-0">
                  <div className="text-yellow-200 text-xs">
                    {new Date(apt.timestamp).toLocaleDateString()}
                  </div>
                  <div className="text-gray-300 text-sm mt-1">
                    {apt.content}
                  </div>
                </div>
              ))}
              {appointments.length > 3 && (
                <div className="text-yellow-400 text-xs">
                  +{appointments.length - 3} more...
                </div>
              )}
            </div>
          )}
        </SciFiCard>

        <SciFiCard
          icon={<div className="w-4 h-4 border border-yellow-400" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />}
          title={`${t.calendarEvents} (${calendarEvents.length})`}
          lang={lang}
        >
          {calendarEvents.length === 0 ? (
            <div className="text-gray-500 italic">{t.noEvents}</div>
          ) : (
            <div className="space-y-2">
              {calendarEvents.slice(0, 3).map((event, index) => (
                <div key={index} className="border-b border-yellow-500/20 pb-2 last:border-b-0">
                  <div className="text-yellow-200 text-xs">
                    {new Date(event.timestamp).toLocaleDateString()}
                  </div>
                  <div className="text-gray-300 text-sm mt-1">
                    {event.content}
                  </div>
                </div>
              ))}
              {calendarEvents.length > 3 && (
                <div className="text-yellow-400 text-xs">
                  +{calendarEvents.length - 3} more...
                </div>
              )}
            </div>
          )}
        </SciFiCard>
      </div>

      {/* System Status */}
      <div className="mt-6 pt-4 border-t border-yellow-500/20">
        <h3 className="text-yellow-400 font-mono text-sm uppercase tracking-wider mb-3">
          System Status
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-mono text-xs">Network</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 font-mono text-xs">Online</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-mono text-xs">Audio</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-green-400 font-mono text-xs">Active</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-mono text-xs">Processing</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full" />
              <span className="text-yellow-400 font-mono text-xs">Ready</span>
            </div>
          </div>
        </div>
      </div>

          </div>
  );
};

export default InformationPanelSciFi;
