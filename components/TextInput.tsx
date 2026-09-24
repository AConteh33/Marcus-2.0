import React, { useState } from 'react';

interface TextInputProps {
  onSubmit: (text: string) => void;
  isReady: boolean;
  isTtsEnabled: boolean;
  onTtsToggle: () => void;
  placeholder?: string;
}

export const TextInput: React.FC<TextInputProps> = ({ onSubmit, isReady, isTtsEnabled, onTtsToggle, placeholder = 'Type a message...' }) => {
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
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={placeholder}
          disabled={!isReady}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-40 transition-colors"
        />
        <button
          type="submit"
          disabled={!isReady || !inputText.trim()}
          className="shrink-0 w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
};
