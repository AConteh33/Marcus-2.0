import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Note, Appointment, CalendarEvent, Language, ThoughtProcess, ToolUsage } from './types';
// import type { LangChainTask } from './services/ai/langchainService'; // Removed - Background AI functionality removed
import { useGeminiLive } from './hooks/useGeminiLive';
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
import { GeminiTTSService } from './services/tts/geminiTTSService';
import { decode, decodeAudioData } from './utils/audio';
import { AutoUpdateManager } from './components/AutoUpdateManager';
import { TranscriptView } from './components/TranscriptView';
import { TextInput } from './components/TextInput';
import { PanelToggleIcon } from './components/Icons';
import { BackgroundSciFi } from './components/BackgroundSciFi';
import { AssistantOrbLiquid } from './components/AssistantOrbLiquid';
import { InformationPanelSciFi } from './components/InformationPanelSciFi';
import { CollapsedPanel } from './components/CollapsedPanel';
import { AIPersonalitySettings } from './components/AIPersonalitySettings';
import { personalityService } from './services/personalityService';
import { promptService } from './prompts/promptService';
import { SessionDataManager } from './services/sessionDataManager';
import { soundEffects } from './services/sound/soundEffects';
import { translations } from './constants';

function App() {
  const [showLandingPage, setShowLandingPage] = useState(false);
  const [currentPersonality, setCurrentPersonality] = useState(personalityService.getCurrentPersonality().id);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [lang, setLang] = useState<Language>('en');
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [newItemsCount, setNewItemsCount] = useState({ notes: 0, appointments: 0, calendarEvents: 0 });
  const [thoughts, setThoughts] = useState<ThoughtProcess[]>([]);
  const [isElectron, setIsElectron] = useState(false);
  const [useGeminiLive, setUseGeminiLive] = useState(true); // Toggle between Live and TTS

  const ttsService = useRef<GeminiTTSService | null>(null);
  const ttsAudioContext = useRef<AudioContext | null>(null);
  
  // Initialize TTS service safely
  useEffect(() => {
    try {
      ttsService.current = new GeminiTTSService();
      console.log('✅ TTS service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize TTS service:', error);
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

  useEffect(() => {
    // Check if we're in Electron
    const checkElectron = () => {
      try {
        return window.electronAPI !== undefined;
      } catch {
        return false;
      }
    };

    setIsElectron(checkElectron());
  }, []);

  // Initialize session data manager
  useEffect(() => {
    SessionDataManager.initialize();
  }, []);

  // Load session data
  useEffect(() => {
    try {
      const sessionData = SessionDataManager.loadData();
      if (sessionData) {
        setNotes(sessionData.notes || []);
        setAppointments(sessionData.appointments || []);
        setCalendarEvents(sessionData.calendarEvents || []);
        setNewItemsCount({
          notes: sessionData.notes?.length || 0,
          appointments: sessionData.appointments?.length || 0,
          calendarEvents: sessionData.calendarEvents?.length || 0
        });
      }
    } catch (error) {
      console.error('Error loading session data:', error);
      // Fallback to empty state
      return { notes: [], appointments: [], calendarEvents: [] };
    }
  }, []);

  // Save session data whenever it changes
  useEffect(() => {
    try {
      SessionDataManager.saveData({
        notes,
        appointments,
        calendarEvents
      });
    } catch (error) {
      console.error('Error saving session data:', error);
    }
  }, [notes, appointments, calendarEvents]);

  // Initialize tools
  useEffect(() => {
    const toolController = new ToolController();

    // Register all tools
    toolController.register(new SaveNoteTool());
    toolController.register(new GetNotesTool());
    toolController.register(new UpdateNoteTool());
    toolController.register(new DeleteNoteTool());
    toolController.register(new SaveAppointmentTool());
    toolController.register(new GetAppointmentsTool());
    toolController.register(new UpdateAppointmentTool());
    toolController.register(new DeleteAppointmentTool());
    toolController.register(new SaveCalendarEventTool());
    toolController.register(new GetCalendarEventsTool());
    toolController.register(new UpdateCalendarEventTool());
    toolController.register(new DeleteCalendarEventTool());
    toolController.register(new ScreenshotTool());
    toolController.register(new ServerManagementTool());
    toolController.register(new EndSessionTool());
    toolController.register(new SetLanguagePreferenceTool());
    toolController.register(new ElectronTerminalTool());
    toolController.register(new FileSearchTool());
    toolController.register(new EnhancedFileSearchTool());
    toolController.register(new DuckDuckGoSearchTool());
    toolController.register(new PuppeteerTool());
    toolController.register(new PuppeteerTerminalTool());
    toolController.register(new SystemStatusTool());
    toolController.register(new ProductivityTools());
    toolController.register(new PythonExcelTool());
    toolController.register(new MouseControlTool());
    toolController.register(new KeyboardControlTool());

    // Set tool usage callback
    toolController.setToolUsageCallback((usage) => {
      setActiveToolUsage(usage);
    });

    return () => {
      toolController;
    };
  }, []);

  // Conditionally use Gemini Live or TTS-only mode
  const geminiLiveHook = useGeminiLive(toolController, addThought);
  const { orbState, transcripts, currentUserTranscript, currentAiTranscript, connect, disconnect, sendText, activeToolUsage, updatePersonality } = geminiLiveHook;

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

  // Handle panel toggle
  const handleTogglePanel = useCallback(() => {
    soundEffects.playClick();
    setIsPanelVisible(prev => !prev);
  }, []);

  // Handle language toggle
  const handleLanguageToggle = useCallback(() => {
    soundEffects.playClick();
    setLang(prev => prev === 'en' ? 'ar' : prev === 'ar' ? 'fr' : prev === 'fr' ? 'es' : 'en');
  }, []);

  // Handle AI connection
  const handleConnect = useCallback(() => {
    if (orbState === 'disconnected' || orbState === 'idle') {
      soundEffects.start();
      connect();
    } else {
      soundEffects.stop();
      disconnect();
    }
  }, [connect, disconnect, orbState]);

  // Handle text input
  const handleTextSubmit = useCallback((text: string) => {
    if (text.trim()) {
      sendText(text);
    }
  }, [sendText]);

  // Handle personality changes
  const handlePersonalityChangeInternal = useCallback((personalityId: string) => {
    soundEffects.playClick();
    handlePersonalityChange(personalityId);
  }, [handlePersonalityChange]);

  // Handle task cancellation
  const handleCancelTask = useCallback((taskId: string) => {
    // Background AI functionality removed
  }, []);

  // Handle PDF download
  const handleDownloadPdf = useCallback(() => {
    // Background AI functionality removed
  }, []);

  // Check if there's new data
  const newItemsCount = useMemo(() => {
    return notes.length + appointments.length + calendarEvents.length;
  }, [notes, appointments, calendarEvents]);

  const isDataAvailable = newItemsCount > 0;

  const addThought = useCallback((type: 'thinking' | 'planning' | 'executing' | 'observing', content: string, step?: number, totalSteps?: number) => {
    setThoughts(prev => [...prev, { type, content, step, totalSteps, timestamp: new Date() }]);
  }, []);

  const clearThoughts = useCallback(() => {
    setThoughts([]);
  }, []);

  // Trigger TTS when AI finishes speaking (TTS-only mode)
  useEffect(() => {
    // Always use TTS instead of Gemini Live audio
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
            alert("API key is not valid. Please check your Gemini API key in the .env.local file.");
          }
        }
      };
      speakAiResponse();
    }
  }, [isTtsEnabled, ttsService, currentAiTranscript, orbState, currentPersonality]);

  useEffect(() => {
    return () => {
      ttsAudioContext.current?.close();
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black text-white font-mono overflow-hidden">
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
                    {orbState === 'disconnected' && (
                      <button
                        onClick={handleConnect}
                        className="px-6 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-200"
                      >
                        {t('startConversation')}
                      </button>
                    )}
                    
                    {orbState === 'connecting' && (
                      <div className="animate-pulse">
                        {t('connecting')}
                      </div>
                    )}
                    
                    {(orbState === 'processing' || orbState === 'speaking') && (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-400/30 border-t-transparent"></div>
                        <span className="text-yellow-400/80">{t('processing')}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow w-full max-w-4xl flex flex-col items-center min-h-0">
                     <TranscriptView
                        transcripts={transcripts}
                        currentUserTranscript={currentUserTranscript}
                        currentAiTranscript={currentAiTranscript}
                      />
                      
                      <TextInput
                        onSendText={handleTextSubmit}
                        orbState={orbState}
                        lang={lang}
                      />
                  </div>
                </main>
                
                {/* Sidebar */}
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
                        activeToolUsage={activeToolUsage}
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
                
                {/* Mobile Panel Toggle */}
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
                  
                  {/* Audio Mode Toggle */}
                  <div className="mt-2 bg-gray-900/90 backdrop-blur-md border border-blue-500/20 rounded-lg px-3 py-1.5 text-xs font-mono text-blue-400/70 hover:text-blue-400 transition-colors duration-200">
                    <button
                      onClick={() => setUseGeminiLive(!useGeminiLive)}
                      className="w-full text-left hover:bg-blue-500/20 transition-colors duration-200"
                    >
                      {useGeminiLive ? '🎤 Gemini Live' : '🔊 TTS Only'}
                    </button>
                  </div>
                </div>
            
            {/* Background Layer */}
            <div className="col-start-1 row-start-1 z-0 w-full h-full min-h-0">
              <BackgroundSciFi />
            </div>
    </div>
  );
}

export default App;
