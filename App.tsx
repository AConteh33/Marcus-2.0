import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Note, Appointment, CalendarEvent, Language, ThoughtProcess, ToolUsage } from './types';
// import type { LangChainTask } from './services/ai/langchainService'; // Removed - Background AI functionality removed
import { useGeminiText } from './hooks/useGeminiText';
import { ToolController } from './tools/toolController';
import { SaveNoteTool } from './tools/saveNoteTool';
import { SaveAppointmentTool } from './tools/saveAppointmentTool';
import { SaveCalendarEventTool, GetCalendarEventsTool, UpdateCalendarEventTool, DeleteCalendarEventTool, GetAppointmentsTool, UpdateAppointmentTool, DeleteAppointmentTool } from './tools/stubTools';
import { ScreenshotTool } from './tools/screenshotTool';
import { ServerManagementTool } from './tools/serverManagementTool';
import { EndSessionTool } from './tools/endSessionTool';
import { SetLanguagePreferenceTool } from './tools/setLanguagePreferenceTool';
import { GetNotesTool } from './tools/getNotesTool';
import { UpdateNoteTool } from './tools/updateNoteTool';
import { DeleteNoteTool } from './tools/deleteNoteTool';
import { ElectronTerminalTool } from './tools/electronTerminalTool';
import { FileSearchTool } from './tools/fileSearchTool';
import { EnhancedFileSearchTool } from './tools/enhancedFileSearchTool';
import { DuckDuckGoSearchTool } from './tools/duckDuckGoSearchTool';
import { PuppeteerTool } from './tools/puppeteerTool';
import { PuppeteerTerminalTool } from './tools/puppeteerTerminalTool';
import { SystemStatusTool } from './tools/systemStatusTool';
import { ProductivityTools } from './tools/productivityTools';
import { PythonExcelTool } from './tools/pythonExcelTool';
import { MouseControlTool } from './tools/mouseControlTool';
import { KeyboardControlTool } from './tools/keyboardControlTool';
// Temporarily comment out old Excel tools that cause build issues
// import { ExcelTool } from './tools/excelTool';
// import { EnhancedExcelTool } from './tools/enhancedExcelTool';
// import { ExcelTerminalTool } from './tools/excelTerminalTool';
import { generatePdf } from './services/pdf';
import AssistantOrbLiquid from './components/AssistantOrbLiquid';
import BackgroundSciFi from './components/BackgroundSciFi';
import InformationPanelSciFi from './components/InformationPanelSciFi';
import { CollapsedPanel } from './components/CollapsedPanel';
import { TranscriptView } from './components/TranscriptView';
import { TextInput } from './components/TextInput';
import { PanelToggleIcon } from './components/Icons';
import { GeminiTTSService } from './services/tts/geminiTTSService';
import { decode, decodeAudioData } from './utils/audio';
import { AutoUpdateManager } from './components/AutoUpdateManager';
import { AIPersonalitySettings } from './components/AIPersonalitySettings';
import { personalityService } from './services/personalityService';
import LandingPage from './components/LandingPage';
import { soundEffects } from './services/sound/soundEffects';
import { translations } from './constants';

function App() {
  const [showLandingPage, setShowLandingPage] = useState(false);
  const [currentPersonality, setCurrentPersonality] = useState(personalityService.getCurrentPersonality().id);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [lang, setLang] = useState<Language>('en');
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [newItemsCount, setNewItemsCount] = useState({ notes: 0, appointments: 0, calendarEvents: 0 });
  
  // Load data from sessionStorage on mount
  const loadSessionData = (): { notes: Note[]; appointments: Appointment[]; calendarEvents: CalendarEvent[] } => {
    try {
      const saved = sessionStorage.getItem('side_panel_data');
      if (saved) {
        const data = JSON.parse(saved);
        return {
          notes: data.notes || [],
          appointments: data.appointments || [],
          calendarEvents: data.calendarEvents || []
        };
      }
    } catch (error) {
      console.error('Error loading session data:', error);
    }
    return { notes: [], appointments: [], calendarEvents: [] };
  };

  const initialData = loadSessionData();
  const [notes, setNotes] = useState<Note[]>(initialData.notes);
  const [appointments, setAppointments] = useState<Appointment[]>(initialData.appointments);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(initialData.calendarEvents);
  const [thoughts, setThoughts] = useState<ThoughtProcess[]>([]);
  const [isElectron, setIsElectron] = useState(false);

  const ttsService = useRef<GeminiTTSService | null>(null);
  const ttsAudioContext = useRef<AudioContext | null>(null);
  
  // Initialize TTS service safely
  useEffect(() => {
    try {
      ttsService.current = new GeminiTTSService();
    } catch (error) {
      console.error('Failed to initialize TTS service:', error);
    }
  }, []);
  
  const t = useMemo(() => translations[lang], [lang]);

  useEffect(() => {
    // Start with panel closed on mobile, open on desktop
    const isMobile = window.innerWidth < 768;
    setIsPanelVisible(!isMobile);
  }, []);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const isPanelVisibleRef = useRef(isPanelVisible);
  useEffect(() => {
    isPanelVisibleRef.current = isPanelVisible;
  }, [isPanelVisible]);

  const onNoteSaved = useCallback(() => {
    if (!isPanelVisibleRef.current) {
      setNewItemsCount(prev => ({ ...prev, notes: prev.notes + 1 }));
    }
  }, []);

  const onAppointmentSaved = useCallback(() => {
    if (!isPanelVisibleRef.current) {
      setNewItemsCount(prev => ({ ...prev, appointments: prev.appointments + 1 }));
    }
  }, []);

  const onEventSaved = useCallback(() => {
    if (!isPanelVisibleRef.current) {
      setNewItemsCount(prev => ({ ...prev, calendarEvents: prev.calendarEvents + 1 }));
    }
  }, []);

  // Save data to sessionStorage whenever it changes
  useEffect(() => {
    try {
      const dataToSave = {
        notes,
        appointments,
        calendarEvents
      };
      sessionStorage.setItem('side_panel_data', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving session data:', error);
    }
  }, [notes, appointments, calendarEvents]);

  const toolController = useMemo(() => {
    const controller = new ToolController();
    
    // Notes CRUD - updated to use terminal commands
    controller.register(new SaveNoteTool(onNoteSaved));
    controller.register(new GetNotesTool());
    controller.register(new UpdateNoteTool());
    controller.register(new DeleteNoteTool());
    
    // Appointments CRUD - updated to use terminal commands
    controller.register(new SaveAppointmentTool(onAppointmentSaved));
    controller.register(new GetAppointmentsTool());
    controller.register(new UpdateAppointmentTool());
    controller.register(new DeleteAppointmentTool());
    
    // Calendar Events CRUD - updated to use terminal commands
    controller.register(new SaveCalendarEventTool(onEventSaved));
    controller.register(new GetCalendarEventsTool());
    controller.register(new UpdateCalendarEventTool());
    controller.register(new DeleteCalendarEventTool());
    
    // Register core tools - instantiate properly
    controller.register(new ScreenshotTool());
    controller.register(new ServerManagementTool());
    controller.register(new EndSessionTool());
    controller.register(new SetLanguagePreferenceTool());
    controller.register(new ElectronTerminalTool());
    controller.register(new SystemStatusTool());
    controller.register(new ProductivityTools());
    controller.register(new PythonExcelTool());
    controller.register(new MouseControlTool());
    controller.register(new KeyboardControlTool());

    return controller;
  }, [onNoteSaved, onAppointmentSaved, onEventSaved]);

  // Check system status on app startup
  useEffect(() => {
    const checkSystemOnStartup = async () => {
      try {
        const systemStatus = new (await import('./tools/systemStatusTool')).SystemStatusTool();
        const status = await systemStatus.execute({ check: 'puppeteer' });
        
        // If Puppeteer is not available, automatically try to install it
        if (status.includes('Not installed')) {
          console.log('🔧 Puppeteer not available - attempting automatic installation...');
          const installResult = await systemStatus.execute({ check: 'install-puppeteer' });
          console.log('📦 Puppeteer installation result:', installResult);
        } else {
          console.log('✅ Puppeteer is already available');
        }
      } catch (error) {
        console.log('System check completed');
      }
    };

    checkSystemOnStartup();
  }, []);

  const addThought = useCallback((type: ThoughtProcess['type'], content: string, step?: number, totalSteps?: number) => {
    const newThought: ThoughtProcess = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type,
      content,
      step,
      totalSteps
    };
    
    setThoughts(prev => [...prev.slice(-9), newThought]); // Keep only last 10 thoughts
  }, []);

  const clearThoughts = useCallback(() => {
    setThoughts([]);
  }, []);

  const handleCancelTask = useCallback((taskId: string) => {
    // Background AI functionality removed
  }, []);

  const { 
  orbState, 
  transcripts, 
  currentUserTranscript, 
  currentAiTranscript, 
  connect, 
  disconnect, 
  sendText, 
  sendToolResponse, 
  aiService,
  showTextInput,
  pendingText,
  setPendingText,
  handleTextInput,
  cancelTextInput
} = useGeminiText(toolController, addThought);

  // Handle personality change
  const handlePersonalityChange = (personalityId: string) => {
    setCurrentPersonality(personalityId);
    personalityService.setPersonality(personalityId);
    
    // Log personality change (no popup)
    const personality = personalityService.getAllPersonalities().find(p => p.id === personalityId);
    if (personality) {
      console.log(`🎭 Personality changed to ${personality.name} - will take effect on next conversation`);
    }
  };

  const isDataAvailable = useMemo(() => notes.length > 0 || appointments.length > 0 || calendarEvents.length > 0, [notes, appointments, calendarEvents]);
  
  const isReadyForTextInput = useMemo(() => 
    orbState === 'listening' || 
    orbState === 'idle' || 
    orbState === 'processing' || 
    orbState === 'speaking' ||
    orbState === 'connecting',
    [orbState]
  );

  const handleTogglePanel = () => {
    setIsPanelVisible(!isPanelVisible);
    if (!isPanelVisible) {
      setNewItemsCount({ notes: 0, appointments: 0, calendarEvents: 0 });
    }
  };
  
  const handleDownloadPdf = () => {
    generatePdf({ notes, appointments, calendarEvents, lang });
  };

  const handleLanguageToggle = () => {
    setLang(lang === 'en' ? 'ar' : 'en');
    alert(`Language changed to ${lang === 'en' ? 'ar' : 'en'}`);
  };
  
  const handleConnect = () => {
    if (orbState === 'disconnected' || orbState === 'idle') {
      soundEffects.playActivate();
      connect();
    } else {
      soundEffects.playDeactivate();
      disconnect();
    }
  };
  
  const handleDisconnect = () => {
    soundEffects.playDeactivate();
    disconnect();
  };
  
  const handleTextSubmit = async (text: string) => {
    // Add user input as a thought
    addThought('observing', `User: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`);
    
    if (sendText) {
      sendText(text);
    }
  };

  useEffect(() => {
    return () => {
      ttsAudioContext.current?.close();
    };
  }, []);

  // Trigger TTS when AI finishes speaking (now enabled for text service)
  useEffect(() => {
    // Enable TTS for text service since we're not using Gemini Live audio
    if (isTtsEnabled && ttsService.current && currentAiTranscript && orbState === 'idle') {
      const speakAiResponse = async () => {
        try {
          const voiceName = personalityService.getVoiceName();
          console.log(`🎤 AI speaking with voice: ${voiceName} for personality: ${currentPersonality}`);
          console.log(`🎤 AI text: "${currentAiTranscript.substring(0, 50)}..."`);
          
          const base64Audio = await ttsService.current.synthesize(currentAiTranscript, voiceName);
          if (base64Audio) {
            if (!ttsAudioContext.current) {
              ttsAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const audioBuffer = await decodeAudioData(decode(base64Audio), ttsAudioContext.current, 24000, 1);
            const source = ttsAudioContext.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ttsAudioContext.current.destination);
            source.start();
          }
        } catch (error) {
          console.error("AI TTS failed", error);
          if (error instanceof Error && error.message.includes("API key not valid")) {
            alert("TTS API key is not valid. Please check your GEMINI_API_KEY in .env.local file.");
          }
        }
      };

      speakAiResponse();
    }
  }, [isTtsEnabled, ttsService, currentAiTranscript, orbState, personalityService, currentPersonality]);

  if (showLandingPage) {
    return (
      <div className="bg-black text-gray-100 font-sans antialiased flex-1 w-full">
        <div className="flex flex-col items-center justify-center h-full p-8">
          <LandingPage onBegin={() => setShowLandingPage(false)} />
        </div>
      </div>
    );
  }


  return (
    <div className="bg-black text-gray-100 font-sans antialiased flex-1 w-full grid grid-rows-1 overflow-hidden">
      {/* AI Personality Settings - Fixed Top Left */}
      <AIPersonalitySettings
        currentPersonality={currentPersonality}
        onPersonalityChange={handlePersonalityChange}
      />
      
      {/* Auto-Update Manager */}
      <AutoUpdateManager />
        
      {/* Background Layer */}
      <div className="col-start-1 row-start-1 z-0 w-full h-full min-h-0">
        <BackgroundSciFi />
      </div>
      
      {/* Foreground/Content Layer */}
      <div className="col-start-1 row-start-1 z-10 w-full h-full min-h-0 bg-black/50 relative md:flex overflow-x-hidden">
        <main className="flex-1 flex flex-col items-center h-full p-4 min-h-0">

          <div className="relative flex flex-col items-center justify-center mt-6 mb-4 pt-6 shrink-0">
            <AssistantOrbLiquid
              state={orbState}
              onClick={handleConnect}
              ariaLabel={orbState === 'disconnected' || orbState === 'idle' ? 'Start AI Assistant' : 'Stop AI Conversation'}
            />
          </div>
          
          <div className="text-center text-yellow-400/80 mb-4 h-6 shrink-0 font-mono">
            {orbState === 'disconnected' && 'Tap to Start'}
            {orbState === 'connecting' && 'Connecting...'}
            {orbState === 'idle' && 'Tap to Stop'}
            {orbState === 'listening' && 'Listening...'}
            {orbState === 'processing' && 'Thinking...'}
            {orbState === 'speaking' && 'Speaking...'}
          </div>
          
          <div className="flex-grow w-full max-w-4xl flex flex-col items-center min-h-0">
             <TranscriptView
                transcripts={transcripts}
                currentUserTranscript={currentUserTranscript}
                currentAiTranscript={currentAiTranscript}
             />
          </div>

          <div className="shrink-0 w-full">
            <TextInput
              onSubmit={handleTextSubmit}
              isReady={isReadyForTextInput}
              isTtsEnabled={isTtsEnabled}
              onTtsToggle={() => setIsTtsEnabled(!isTtsEnabled)}
            />
          </div>
        </main>

        {/* Mobile Backdrop */}
        {isPanelVisible && (
          <div
            onClick={handleTogglePanel}
            className="fixed inset-0 bg-black/80 z-20 md:hidden"
            aria-hidden="true"
          />
        )}

        <aside className={`
          fixed md:relative inset-y-0 right-0 z-30 h-full
          w-full max-w-sm sm:max-w-md md:w-auto
          bg-gray-900/90 md:bg-transparent backdrop-blur-md md:backdrop-blur-none
          border-l border-yellow-500/20 shadow-2xl shadow-yellow-500/10
          transform transition-all duration-300 ease-in-out
          md:transform-none md:border-l
          ${isPanelVisible ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
          <div className={`h-full transition-all duration-300 ${isPanelVisible ? 'md:w-96' : 'md:w-24'}`}>
            {isPanelVisible ? (
              <InformationPanelSciFi
                notes={notes}
                appointments={appointments}
                calendarEvents={calendarEvents}
                lang={lang}
                onToggle={handleTogglePanel}
                onDownloadPdf={handleDownloadPdf}
                isDataAvailable={isDataAvailable}
                onLanguageToggle={handleLanguageToggle}
                activeToolUsage={null}
                thoughts={thoughts}
                onClearThoughts={clearThoughts}
              />
            ) : (
              <div className="hidden md:block h-full">
                <CollapsedPanel
                  newItemsCount={newItemsCount}
                  onExpand={handleTogglePanel}
                />
              </div>
            )}
          </div>
        </aside>

        {!isPanelVisible && (
          <button
              onClick={() => {
                soundEffects.playClick();
                handleTogglePanel();
              }}
              className="fixed top-4 right-4 p-1.5 text-yellow-400 hover:text-yellow-300 rounded-full bg-gray-900/90 hover:bg-yellow-500/20 border border-yellow-500/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 md:hidden z-40 transition-all duration-200"
              aria-label="Expand panel"
          >
              <PanelToggleIcon className="w-6 h-6" isPanelVisible={false} />
          </button>
        )}

        {/* Version Display - Bottom Left */}
        <div className="fixed bottom-4 left-4 z-20">
          <div className="bg-gray-900/90 backdrop-blur-md border border-yellow-500/20 rounded-lg px-3 py-1.5 text-xs font-mono text-yellow-400/70 hover:text-yellow-400 transition-colors duration-200">
            v1.8.2
          </div>
        </div>

        {/* Speech-to-Text Input Dialog */}
        {showTextInput && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-yellow-500/30 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
              <h3 className="text-yellow-400 text-lg font-semibold mb-4">
                🎤 Speech Detected
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                I heard something. What did you want to say?
              </p>
              <input
                type="text"
                value={pendingText}
                onChange={(e) => setPendingText(e.target.value)}
                placeholder="Type your message here..."
                className="w-full bg-gray-800 border border-yellow-500/20 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTextInput(pendingText);
                  } else if (e.key === 'Escape') {
                    cancelTextInput();
                  }
                }}
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleTextInput(pendingText)}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Send
                </button>
                <button
                  onClick={cancelTextInput}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;