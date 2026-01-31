import React, { useState } from 'react';
import { TtsToggleIcon } from './Icons';

interface TextInputProps {
    onSubmit: (text: string) => void;
    isReady: boolean;
    isTtsEnabled: boolean;
    onTtsToggle: () => void;
}

export const TextInput: React.FC<TextInputProps> = ({ onSubmit, isReady, isTtsEnabled, onTtsToggle }) => {
    const [inputText, setInputText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const text = inputText.trim();
        if (text) {
            onSubmit(text);
            setInputText('');
        }
    };

    return (
        <div className="w-full max-w-lg pt-4 mx-auto shrink-0">
            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Or type your message here..."
                    disabled={!isReady}
                    className="w-full bg-white/80 border border-amber-500/30 rounded-full py-3 ps-6 pe-28 text-gray-800 placeholder-amber-600/70 focus:outline-none focus:ring-2 focus:ring-amber-400/50 disabled:opacity-50"
                />
                <div className="absolute end-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={onTtsToggle}
                        className="p-2 text-amber-600 hover:text-amber-800 rounded-full hover:bg-amber-500/20 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        aria-label="Toggle Text-to-Speech"
                    >
                        <TtsToggleIcon isEnabled={isTtsEnabled} className="h-5 w-5" />
                    </button>
                    <button type="submit" disabled={!isReady} className="p-2 bg-amber-500/20 text-amber-700 rounded-full hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
};