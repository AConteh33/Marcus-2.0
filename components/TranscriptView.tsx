import React, { useRef, useEffect } from 'react';
import type { Transcript } from '../types';

interface TranscriptViewProps {
    transcripts: Transcript[];
    currentUserTranscript?: string;
    currentAiTranscript?: string;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({ transcripts, currentUserTranscript, currentAiTranscript }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [transcripts, currentUserTranscript, currentAiTranscript]);

    return (
        <div ref={containerRef} className="flex-grow w-full overflow-y-auto p-4 space-y-4">
           {transcripts.map((t) => (
                <div key={t.id} className={`flex ${t.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xl p-4 rounded-lg border transition-all duration-300 ${
                        t.speaker === 'user' 
                            ? 'bg-amber-600/90 text-white border-amber-500/30 shadow-lg shadow-amber-500/20' 
                            : 'bg-black/60 text-yellow-100 border-yellow-500/20 shadow-lg shadow-yellow-500/10'
                    }`}>
                        <p className={`text-sm leading-relaxed ${
                            t.speaker === 'user' ? 'text-white' : 'text-yellow-100'
                        }`}>{t.text}</p>
                     </div>
                </div>
           ))}
           {currentUserTranscript && (
                <div className="flex justify-end">
                    <div className="max-w-xl p-4 rounded-lg bg-amber-600/90 text-white border-amber-500/30 shadow-lg shadow-amber-500/20 transition-all duration-300">
                        <p className="text-sm leading-relaxed text-white">{currentUserTranscript}</p>
                     </div>
                </div>
           )}
           {currentAiTranscript && (
                <div className="flex justify-start">
                    <div className="max-w-xl p-4 rounded-lg bg-black/60 text-yellow-100 border-yellow-500/20 shadow-lg shadow-yellow-500/10 transition-all duration-300">
                        <p className="text-sm leading-relaxed text-yellow-100">{currentAiTranscript}</p>
                     </div>
                </div>
           )}
        </div>
    );
};