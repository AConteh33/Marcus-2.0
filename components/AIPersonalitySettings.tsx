import React, { useState, useEffect } from 'react';
import { SettingsIcon } from './Icons';
import { soundEffects } from '../services/sound/soundEffects';

interface Personality {
  id: string;
  name: string;
  description: string;
  example: string;
  color: string;
}

const personalities: Personality[] = [
  {
    id: 'mariah',
    name: 'Mariah',
    description: 'Professional AI assistant',
    example: '"I will help you complete this task efficiently."',
    color: 'green'
  },
  {
    id: 'marcus',
    name: 'Marcus',
    description: 'Gen Z AI with jokes and disses',
    example: '"Aight bet, let me cook this up real quick. No cap."',
    color: 'yellow'
  },
  {
    id: 'kev',
    name: 'Kev',
    description: 'Rebellious AI with attitude',
    example: '"Ugh, another task? Fine, but you owe me big time."',
    color: 'red'
  }
];

interface AIPersonalitySettingsProps {
  currentPersonality: string;
  onPersonalityChange: (personalityId: string) => void;
  className?: string;
  lang?: string;
}

export const AIPersonalitySettings: React.FC<AIPersonalitySettingsProps> = ({
  currentPersonality,
  onPersonalityChange,
  className = '',
  lang = 'en'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPersonality, setSelectedPersonality] = useState(currentPersonality);

  useEffect(() => {
    setSelectedPersonality(currentPersonality);
  }, [currentPersonality]);

  const handlePersonalitySelect = (personalityId: string) => {
    setSelectedPersonality(personalityId);
    onPersonalityChange(personalityId);
    setIsOpen(false);
    soundEffects.playClick();
  };

  // Determine positioning based on language direction
  const getPositionClasses = () => {
    const isRTL = lang === 'ar';
    return {
      button: isRTL ? 'fixed top-8 right-4' : 'fixed top-8 left-4',
      panel: isRTL ? 'fixed top-20 right-4' : 'fixed top-20 left-4',
      transform: isRTL 
        ? (isOpen ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95')
        : (isOpen ? 'translate-x-0 opacity-100 scale-100' : '-translate-x-full opacity-0 scale-95')
    };
  };

  const getCurrentPersonality = () => {
    return personalities.find(p => p.id === selectedPersonality) || personalities[0];
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'border-green-500/50 text-green-400 bg-green-500/10';
      case 'yellow':
        return 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10';
      case 'red':
        return 'border-red-500/50 text-red-400 bg-red-500/10';
      default:
        return 'border-gray-500/50 text-gray-400 bg-gray-500/10';
    }
  };

  const getStatusColor = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'red':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Settings Button - Top Left Placement */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          soundEffects.playClick();
        }}
        className={getPositionClasses().button}
      >
        <div className={`
          relative p-3 border border-yellow-500/30 rounded-lg backdrop-blur-sm transition-all duration-300
          ${isOpen ? 'bg-black/80 border-yellow-400/50 shadow-lg shadow-yellow-500/20' : 'bg-black/60 hover:bg-black/80 hover:border-yellow-400/50'}
        `}>
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-yellow-500/50" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-yellow-500/50" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-yellow-500/50" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-yellow-500/50" />
          
          <div className="relative flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
            <div className="flex flex-col items-start">
              <span className="text-yellow-300 font-mono text-xs uppercase tracking-wider">AI Mode</span>
              <span className="text-gray-300 font-mono text-xs">{getCurrentPersonality().name}</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${getStatusColor(getCurrentPersonality().color)} animate-pulse`}></div>
          </div>
        </div>
      </button>

      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={() => {
            setIsOpen(false);
            soundEffects.playClick();
          }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
        />
      )}

      {/* Settings Panel */}
      <div className={`
        ${getPositionClasses().panel} z-50 w-80 max-h-[70vh]
        transform transition-all duration-700 ease-out
        ${getPositionClasses().transform}
      `}>
        <div className={`
          relative border border-yellow-500/30 rounded-lg backdrop-blur-sm transition-all duration-300
          bg-black/90 shadow-2xl shadow-yellow-500/10
          ${isOpen ? 'shadow-yellow-500/30' : ''}
          h-full flex flex-col
        `}>
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow-500/50" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow-500/50" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow-500/50" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow-500/50" />
          
          <div className="p-4 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center space-x-3">
                <SettingsIcon className="w-5 h-5 text-yellow-400" />
                <h3 className="text-yellow-300 font-mono text-sm uppercase tracking-wider">AI Personality</h3>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  soundEffects.playClick();
                }}
                className="text-gray-400 hover:text-yellow-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Scrollable Personality Options */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {personalities.map((personality, index) => (
                <div
                  key={personality.id}
                  onClick={() => handlePersonalitySelect(personality.id)}
                  className={`
                    relative border rounded-lg p-3 cursor-pointer transition-all duration-300
                    ${selectedPersonality === personality.id
                      ? `${getColorClasses(personality.color)} border-current shadow-lg`
                      : 'bg-black/60 border-gray-600/50 hover:bg-black/80 hover:border-gray-500/50'
                    }
                    transform transition-all duration-500 ease-out
                    ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}
                  `}
                  style={{
                    transitionDelay: `${index * 100}ms`
                  }}
                >
                  {/* Selection indicator */}
                  {selectedPersonality === personality.id && (
                    <div className="absolute top-2 right-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(personality.color)} animate-pulse`}></div>
                    </div>
                  )}
                  
                  <div className="flex items-start space-x-4">
                    {/* Personality indicator */}
                    <div className={`w-4 h-4 rounded-full ${getStatusColor(personality.color)} mt-1`}></div>
                    
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-2">{personality.name}</h4>
                      <p className="text-gray-300 text-sm mb-3">{personality.description}</p>
                      
                      {/* Example */}
                      <div className="p-3 bg-black/40 rounded border border-gray-700/50">
                        <p className="text-gray-300 text-xs italic font-mono">"{personality.example}"</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Footer */}
            <div className="mt-3 pt-3 border-t border-gray-700 shrink-0">
              <div className="flex items-center justify-between">
                <p className="text-gray-400 text-xs font-mono">
                  Current: <span className="text-yellow-400">{getCurrentPersonality().name}</span>
                </p>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    soundEffects.playClick();
                  }}
                  className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors font-mono text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
