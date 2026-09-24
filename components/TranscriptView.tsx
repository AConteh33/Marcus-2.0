import React, { useRef, useEffect } from 'react';
import type { Transcript } from '../types';
import { labels, type UILanguage } from '../utils/labels';

interface TranscriptViewProps {
    transcripts: Transcript[];
    currentUserTranscript?: string;
    currentAiTranscript?: string;
    onClearConversationHistory?: () => void;
    lang?: UILanguage;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({ transcripts, currentUserTranscript, currentAiTranscript, onClearConversationHistory, lang = 'ar' }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const t = labels[lang];
    const dir = lang === 'ar' ? 'rtl' : 'ltr';

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [transcripts, currentUserTranscript, currentAiTranscript]);

    return (
        <div className="flex flex-col h-full" dir={dir}>
            {transcripts.length > 0 && onClearConversationHistory && (
                <div className={`flex p-2 ${lang === 'ar' ? 'justify-start' : 'justify-end'}`}>
                    <button
                        onClick={onClearConversationHistory}
                        className="text-xs text-gray-400 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-400/10"
                        title={t.clearHistory}
                    >
                        {t.clearHistory}
                    </button>
                </div>
            )}
            <div ref={containerRef} className="flex-grow w-full overflow-y-auto p-4 space-y-4">
           {transcripts.map((t_msg) => (
                <div key={t_msg.id} className={`flex ${t_msg.speaker === 'user' ? (lang === 'ar' ? 'justify-start' : 'justify-end') : (lang === 'ar' ? 'justify-end' : 'justify-start')}`}>
                    <div className={`max-w-xl p-4 rounded-lg border transition-all duration-300 ${
                        t_msg.speaker === 'user' 
                            ? 'bg-amber-600/90 text-white border-amber-500/30 shadow-lg shadow-amber-500/20' 
                            : 'bg-black/60 text-yellow-100 border-yellow-500/20 shadow-lg shadow-yellow-500/10'
                    }`}>
                        <p className={`text-sm leading-relaxed ${
                            t_msg.speaker === 'user' ? 'text-white' : 'text-yellow-100'
                        }`}>{t_msg.text}</p>
                     </div>
                </div>
           ))}
           {currentUserTranscript && (
                <div className={`flex ${lang === 'ar' ? 'justify-start' : 'justify-end'}`}>
                    <div className="max-w-xl p-4 rounded-lg bg-amber-600/90 text-white border border-amber-500/30 shadow-lg shadow-amber-500/20 transition-all duration-300">
                        <p className="text-sm leading-relaxed text-white">{currentUserTranscript}</p>
                     </div>
                </div>
           )}
           {currentAiTranscript && (
                <div className={`flex ${lang === 'ar' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-xl p-4 rounded-lg bg-black/60 text-yellow-100 border border-yellow-500/20 shadow-lg shadow-yellow-500/10 transition-all duration-300">
                        <p className="text-sm leading-relaxed text-yellow-100">{currentAiTranscript}</p>
                     </div>
                </div>
           )}
        </div>
        </div>
    );
};
