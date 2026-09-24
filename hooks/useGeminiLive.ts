import { useState, useEffect, useRef, useCallback } from 'react';
import type { LiveServerMessage } from "@google/genai";
import { GeminiLiveService } from '../services/ai/geminiLiveService';
import type { AIConversationService } from '../services/ai/aiService';
import { decode, decodeAudioData } from '../utils/audio';
import { promptService } from '../prompts/promptService';
import { personalityService } from '../services/personalityService';
import { ToolController } from '../tools/toolController';
import type { Transcript } from '../types';
import type { OrbState } from '../components/AssistantOrb';
import { EnhancedMicrophone, type MicrophoneOptions } from '../services/audio/enhancedMicrophone';
import { getDeviceId, getTableNumber } from '../utils/device';
import { saveConversation, appendMessage, endConversation, getConversationsByDevice } from '../services/conversationService';
import {
    buildConversationMemoryBlock,
    clearConversationHistory as clearStoredConversationHistory,
    extractLearnableFacts,
    loadConversationHistory,
    loadLearnedFacts,
    mergeLearnedFacts,
    saveConversationHistory,
    saveLearnedFacts,
} from '../services/conversationMemory';

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

export const useGeminiLive = (
    toolController?: ToolController,
    addThought?: (type: 'thinking' | 'planning' | 'executing' | 'observing', content: string, step?: number, totalSteps?: number) => void,
    isAudioEnabled: boolean = true
) => {
    const [orbState, setOrbState] = useState<OrbState>('disconnected');
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    const [currentUserTranscript, setCurrentUserTranscript] = useState('');
    const [currentAiTranscript, setCurrentAiTranscript] = useState('');
    const [activeToolUsage, setActiveToolUsage] = useState<any>(null);
    const [connectionAttempts, setConnectionAttempts] = useState(0);
    
    const aiService = useRef<AIConversationService | null>(null);
    const outputAudioContext = useRef<AudioContext | null>(null);
    const enhancedMicrophone = useRef<EnhancedMicrophone | null>(null);
    const nextStartTime = useRef(0);
    const audioSources = useRef<Set<AudioBufferSourceNode>>(new Set());
    const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
    const isAudioEnabledRef = useRef(isAudioEnabled);
    const connectingRef = useRef(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
    const conversationIdRef = useRef<string | null>(null);
    const deviceIdRef = useRef(getDeviceId());
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

    const accumulatedInputRef = useRef('');
    const accumulatedOutputRef = useRef('');
    
    const orbStateRef = useRef(orbState);
    useEffect(() => {
        orbStateRef.current = orbState;
    }, [orbState]);

    useEffect(() => {
        isAudioEnabledRef.current = isAudioEnabled;
        // Stop any queued playback when muted
        if (!isAudioEnabled) {
            audioSources.current.forEach(source => {
                try { source.stop(); } catch { /* already stopped */ }
            });
            audioSources.current.clear();
            nextStartTime.current = 0;
        }
    }, [isAudioEnabled]);

    // Clear heartbeat on unmount
    useEffect(() => {
        return () => {
            if (heartbeatInterval.current) {
                clearInterval(heartbeatInterval.current);
                heartbeatInterval.current = null;
            }
        };
    }, []);

    // Connection keep-alive: do NOT send text pings — they look like user turns and make the model talk to itself.
    const startHeartbeat = useCallback(() => {
        if (heartbeatInterval.current) {
            clearInterval(heartbeatInterval.current);
            heartbeatInterval.current = null;
        }
    }, []);

    const stopHeartbeat = useCallback(() => {
        if (heartbeatInterval.current) {
            clearInterval(heartbeatInterval.current);
            heartbeatInterval.current = null;
        }
    }, []);

    const connect = useCallback(async () => {
        if (connectingRef.current) {
            console.log('Connect called but already connecting. Ignoring.');
            return;
        }
        if (orbStateRef.current !== 'idle' && orbStateRef.current !== 'disconnected') {
            console.log('Connect called but already connected. Current state:', orbStateRef.current);
            return;
        }
        connectingRef.current = true;
        console.log('Initiating connection...');
        setOrbState('connecting');

        try {
            // Initialize microphone
            console.log('Initializing microphone...');
            const microphoneOptions: MicrophoneOptions = {
                sampleRate: INPUT_SAMPLE_RATE,
                echoCancellation: true,
                noiseSuppression: false,
                autoGainControl: true,
                deviceId: selectedDeviceId || undefined,
                onAudioLevel: (level) => setAudioLevel(level),
                onError: (error) => {
                    console.error('Microphone error:', error);
                }
            };

            enhancedMicrophone.current = new EnhancedMicrophone(microphoneOptions);
            await enhancedMicrophone.current.initialize();

            // Get available devices for device selection
            const devices = await enhancedMicrophone.current.getAvailableDevices();
            setAvailableDevices(devices);

            // Fix: Cast window to any to access webkitAudioContext and resolve TypeScript error.
            outputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });

            try {
                aiService.current = new GeminiLiveService();
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                if (errorMessage.includes('API_KEY')) {
                    alert("API_KEY environment variable not set. Please set GEMINI_API_KEY in your .env.local file.");
                } else {
                    throw error; // Re-throw if it's not an API key error
                }
                setOrbState('disconnected');
                return;
            }

            // Load prior conversation + learned facts so the model can continue and think ahead
            const conversationHistory = loadConversationHistory();
            const learnedFacts = loadLearnedFacts();
            if (conversationHistory.length > 0) {
                setTranscripts(conversationHistory);
            }
            const conversationContext = buildConversationMemoryBlock(conversationHistory, learnedFacts);

            // Load recent Firestore conversations for context
            let firestoreContext = '';
            try {
                const recentConversations = await getConversationsByDevice(deviceIdRef.current, 5);
                if (recentConversations.length > 0) {
                    const recentMessages = recentConversations.flatMap(c => c.messages || []);
                    if (recentMessages.length > 0) {
                        firestoreContext = '\n\nPREVIOUS CONVERSATIONS WITH THIS CUSTOMER:\n' +
                            recentMessages.slice(-20).map(m => `${m.role}: ${m.text}`).join('\n');
                    }
                }
            } catch (e) {
                console.log('Could not load Firestore conversations:', e);
            }

            // Create new conversation document
            try {
                const convId = await saveConversation({
                    deviceId: deviceIdRef.current,
                    tableNumber: getTableNumber(),
                    language: 'ar',
                    messages: []
                });
                conversationIdRef.current = convId;
            } catch (e) {
                console.log('Could not create Firestore conversation:', e);
            }

            // Never inject fake user messages via sendText — that causes self-talk.
            // Wait for the real user; do not invent an opening conversation.
            const sessionStartGuidance = conversationHistory.length === 0
                ? "\n\nSESSION START: IMMEDIATELY call the listMenu tool to get the full menu. Do NOT speak until you have the menu. After getting the menu, greet them briefly in their language and ask what they want."
                : '\n\nSESSION START: Continuing prior conversation. IMMEDIATELY call the listMenu tool to refresh the menu. Match their language exactly. Do not repeat.';

            aiService.current.connect({
                callbacks: {
                    onopen: () => {
                        console.log('Connection opened.');
                        connectingRef.current = false;
                        setOrbState('idle');
                        setConnectionAttempts(0);
                        startHeartbeat();
                        startMicrophoneProcessing();
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent) {
                            // Handle transcriptions
                            if (message.serverContent.inputTranscription) {
                                setOrbState('listening');
                                // If user starts speaking, clear any partial AI response.
                                if (accumulatedOutputRef.current) {
                                    accumulatedOutputRef.current = '';
                                    setCurrentAiTranscript('');
                                }
                                accumulatedInputRef.current += message.serverContent.inputTranscription.text;
                                setCurrentUserTranscript(accumulatedInputRef.current);
                            }
                            if (message.serverContent.outputTranscription) {
                                setOrbState('speaking');
                                // Don't add AI responses as thoughts - only show thinking/planning/executing
                                accumulatedOutputRef.current += message.serverContent.outputTranscription.text;
                                const styledResponse = personalityService.styleResponse(accumulatedOutputRef.current);
                                setCurrentAiTranscript(styledResponse);
                            }
                            if (message.serverContent.turnComplete) {
                                const finalInput = accumulatedInputRef.current.trim();
                                let finalOutput = accumulatedOutputRef.current.trim();
                                
                                // Apply personality styling to the final output
                                finalOutput = personalityService.styleResponse(finalOutput);

                                // Learn durable facts from this user turn
                                if (finalInput) {
                                    const newFacts = extractLearnableFacts(finalInput);
                                    if (newFacts.length > 0) {
                                        const merged = mergeLearnedFacts(loadLearnedFacts(), newFacts);
                                        saveLearnedFacts(merged);
                                    }
                                }

                                setTranscripts(prev => {
                                    const newHistory = [...prev];
                                    if (finalInput) {
                                        newHistory.push({ id: crypto.randomUUID(), speaker: 'user', text: finalInput });
                                    }
                                    if (finalOutput) {
                                        newHistory.push({ id: crypto.randomUUID(), speaker: 'ai', text: finalOutput });
                                    }
                                    saveConversationHistory(newHistory);

                                    // Save to Firestore
                                    if (conversationIdRef.current && finalInput) {
                                        appendMessage(conversationIdRef.current, {
                                            role: 'user',
                                            text: finalInput,
                                            timestamp: new Date().toISOString()
                                        }).catch(console.error);
                                    }
                                    if (conversationIdRef.current && finalOutput) {
                                        appendMessage(conversationIdRef.current, {
                                            role: 'assistant',
                                            text: finalOutput,
                                            timestamp: new Date().toISOString()
                                        }).catch(console.error);
                                    }

                                    return newHistory;
                                });
                                
                                accumulatedInputRef.current = '';
                                accumulatedOutputRef.current = '';
                                setCurrentUserTranscript('');
                                setCurrentAiTranscript('');
                                setOrbState('idle');
                            }

                            // Handle audio playback (respect mute toggle)
                            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                            if (audioData && outputAudioContext.current && aiService.current && isAudioEnabledRef.current) {
                                try {
                                    setOrbState('speaking');
                                    const decodedBytes = decode(audioData);
                                    const audioBuffer = await decodeAudioData(decodedBytes, outputAudioContext.current, OUTPUT_SAMPLE_RATE, 1);
                                    
                                    // Check if connection is still alive before playing audio
                                    if (orbStateRef.current === 'disconnected') {
                                        console.log('Connection lost, skipping audio playback');
                                        return;
                                    }
                                    
                                    const source = outputAudioContext.current.createBufferSource();
                                    source.buffer = audioBuffer;
                                    source.connect(outputAudioContext.current.destination);

                                    const currentTime = outputAudioContext.current.currentTime;
                                    nextStartTime.current = Math.max(nextStartTime.current, currentTime);
                                    
                                    source.start(nextStartTime.current);
                                    nextStartTime.current += audioBuffer.duration;
                                    audioSources.current.add(source);
                                    
                                    source.onended = () => {
                                        audioSources.current.delete(source);
                                        // Only set to idle if not processing and no more audio sources
                                        if (audioSources.current.size === 0 && orbStateRef.current !== 'processing') {
                                            setOrbState('idle');
                                        }
                                    };
                                    
                                    // Add error handling for audio playback
                                    source.onerror = (error) => {
                                        console.error('Audio playback error:', error);
                                        audioSources.current.delete(source);
                                        if (audioSources.current.size === 0 && orbStateRef.current !== 'processing') {
                                            setOrbState('idle');
                                        }
                                    };
                                } catch (error) {
                                    console.error('Error processing audio data:', error);
                                    setOrbState('idle');
                                }
                            }

                            if (message.serverContent.interrupted) {
                                console.log('Interrupted');
                                audioSources.current.forEach(source => source.stop());
                                audioSources.current.clear();
                                nextStartTime.current = 0;
                            }
                        }

                        if (message.toolCall) {
                            setOrbState('processing');
                            const functionCalls = message.toolCall.functionCalls || [];
                            addThought?.('executing', `Tools: ${functionCalls.map(fc => fc.name).join(', ')}`);

                            if (!toolController) {
                                console.error('Tool call received but ToolController is missing');
                                aiService.current?.sendToolResponse({
                                    functionResponses: functionCalls.map(fc => ({
                                        id: fc.id,
                                        name: fc.name,
                                        response: { error: 'ToolController is not available' },
                                    })),
                                });
                                setOrbState('idle');
                                return;
                            }

                            const functionResponses: Array<{
                                id?: string;
                                name?: string;
                                response: Record<string, unknown>;
                            }> = [];

                            for (const fc of functionCalls) {
                                addThought?.('thinking', `Tool: ${fc.name}`);
                                let result: string;
                                try {
                                    result = await toolController.executeTool(fc.name!, fc.args);
                                } catch (error) {
                                    result = `Error executing ${fc.name}: ${error instanceof Error ? error.message : String(error)}`;
                                }

                                // Show tool results in sidebar instead of chat
                                setActiveToolUsage({
                                    toolName: fc.name,
                                    args: fc.args,
                                    result: result,
                                    timestamp: new Date()
                                });

                                addThought?.('observing', `Result: ${result.substring(0, 50)}${result.length > 50 ? '...' : ''}`);

                                functionResponses.push({
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result },
                                });

                                if (fc.name === 'endSession') {
                                    // Still send the response before disconnecting
                                    aiService.current?.sendToolResponse({ functionResponses });
                                    disconnect();
                                    return;
                                }
                            }

                            // Live API requires functionResponses to be an array (can be parallel calls)
                            aiService.current?.sendToolResponse({ functionResponses });
                            setOrbState('idle');
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Connection error:', e);
                        connectingRef.current = false;
                        stopHeartbeat();
                        
                        // Attempt reconnection for network errors
                        if (e.message.includes('Network') || e.message.includes('timeout')) {
                            const attempts = connectionAttempts + 1;
                            setConnectionAttempts(attempts);
                            
                            if (attempts <= 3) {
                                console.log(`Attempting reconnection (${attempts}/3)...`);
                                setTimeout(() => {
                                    connect();
                                }, Math.min(1000 * Math.pow(2, attempts - 1), 5000)); // Exponential backoff
                                return;
                            }
                        }
                        
                        // A generic "Network error" often indicates an issue with the API key.
                        alert("Connection failed. This may be due to a network issue or an invalid API key. Please check your connection and API key, then try again.");
                        setOrbState('disconnected');
                        disconnect();
                    },
                    onclose: (event?: CloseEvent) => {
                        console.log('Connection closed.', event ? {
                            code: event.code,
                            reason: event.reason,
                            wasClean: event.wasClean
                        } : 'No close event details');
                        
                        connectingRef.current = false;
                        stopHeartbeat();
                        
                        // Handle specific error codes with reconnection logic
                        if (event) {
                            if (event.code === 1011) {
                                // Quota exceeded or billing issue
                                const reason = event.reason || '';
                                if (reason.includes('quota') || reason.includes('billing')) {
                                    alert('API Quota Exceeded: You have exceeded your current Gemini API quota. Please check your plan and billing details at https://aistudio.google.com/apikey');
                                } else {
                                    // 1011 without quota mention - try reconnection
                                    const attempts = connectionAttempts + 1;
                                    setConnectionAttempts(attempts);
                                    
                                    if (attempts <= 3) {
                                        console.log(`Connection lost (1011), attempting reconnection (${attempts}/3)...`);
                                        setTimeout(() => {
                                            connect();
                                        }, Math.min(1000 * Math.pow(2, attempts - 1), 5000));
                                        return;
                                    }
                                    
                                    alert(`Connection closed: ${reason}`);
                                }
                            } else if (event.code === 1006) {
                                // Abnormal closure - try reconnection
                                const attempts = connectionAttempts + 1;
                                setConnectionAttempts(attempts);
                                
                                if (attempts <= 3) {
                                    console.log(`Abnormal closure (1006), attempting reconnection (${attempts}/3)...`);
                                    setTimeout(() => {
                                        connect();
                                    }, Math.min(1000 * Math.pow(2, attempts - 1), 5000));
                                    return;
                                }
                                
                                alert('Connection closed unexpectedly after multiple attempts. Please check your connection and try again.');
                            } else if (event.code === 1000 && !event.wasClean) {
                                // Unclean normal closure - try reconnection
                                const attempts = connectionAttempts + 1;
                                setConnectionAttempts(attempts);
                                
                                if (attempts <= 2) {
                                    console.log(`Unclean closure (1000), attempting reconnection (${attempts}/2)...`);
                                    setTimeout(() => {
                                        connect();
                                    }, 1000);
                                    return;
                                }
                            } else if (event.reason) {
                                alert(`Connection closed: ${event.reason}`);
                            }
                        }
                        
                        setOrbState('disconnected');
                        disconnect();
                    },
                },
                config: {
                    systemInstruction: promptService.getSystemInstruction() + conversationContext + firestoreContext + sessionStartGuidance,
                    tools: toolController
                        ? [{ functionDeclarations: toolController.getDeclarations() }]
                        : [],
                    voiceName: personalityService.getVoiceName(),
                }
            });
        } catch (error) {
            console.error('Failed to start session:', error);
            connectingRef.current = false;
            setOrbState('disconnected');
        }
    }, [toolController, connectionAttempts, startHeartbeat, stopHeartbeat, selectedDeviceId]);

    const startMicrophoneProcessing = () => {
        console.log('Starting microphone audio processing...');

        // Start audio processing with the enhanced microphone
        const processAudio = () => {
            if (!enhancedMicrophone.current || !aiService.current) return;
            
            // Prevent feedback loop by not processing audio while the AI is speaking.
            if (orbStateRef.current === 'speaking') {
                requestAnimationFrame(processAudio);
                return;
            }

            const audioData = enhancedMicrophone.current.getProcessedAudio();
            if (audioData) {
                aiService.current.sendAudio(audioData);
            }

            // Continue processing
            requestAnimationFrame(processAudio);
        };

        requestAnimationFrame(processAudio);
    };

    const stopMicrophoneProcessing = () => {
        // Stop the enhanced microphone
        if (enhancedMicrophone.current) {
            enhancedMicrophone.current.stop();
            enhancedMicrophone.current = null;
        }
    };

    const disconnect = useCallback(() => {
        console.log('FORCE CANCEL - Stopping everything immediately...');
        
        // End conversation in Firestore
        if (conversationIdRef.current) {
            endConversation(conversationIdRef.current).catch(console.error);
            conversationIdRef.current = null;
        }
        
        // Set state to disconnected immediately to prevent any further processing
        setOrbState('disconnected');
        orbStateRef.current = 'disconnected';
        connectingRef.current = false;
        
        // Stop heartbeat
        stopHeartbeat();
        
        // Force stop all audio processing immediately
        stopMicrophoneProcessing();
        
        // Force close AI service without waiting
        if (aiService.current) {
            try {
                aiService.current.close();
            } catch (error) {
                console.log('Error closing AI service:', error);
            }
            aiService.current = null;
        }
        
        // Force close output audio context
        if (outputAudioContext.current) {
            try {
                outputAudioContext.current.suspend();
                outputAudioContext.current.close();
            } catch (error) {
                console.log('Error closing output audio context:', error);
            }
            outputAudioContext.current = null;
        }
        
        // Clear all accumulated audio and text
        accumulatedInputRef.current = '';
        accumulatedOutputRef.current = '';
        setCurrentUserTranscript('');
        setCurrentAiTranscript('');
        
        // Stop all audio sources in the queue
        audioSources.current.forEach(source => {
            try {
                source.stop();
            } catch (error) {
                console.log('Error stopping audio source:', error);
            }
        });
        audioSources.current.clear();
        
        // Double-check state is disconnected
        setTimeout(() => {
            setOrbState('disconnected');
            orbStateRef.current = 'disconnected';
        }, 50);
        
        console.log('FORCE CANCEL COMPLETE - Everything stopped');
    }, []);

    const clearConversationHistory = useCallback(() => {
        try {
            clearStoredConversationHistory();
            setTranscripts([]);
            console.log('🗑️ Conversation history cleared');
        } catch (e) {
            console.warn('Failed to clear conversation history:', e);
        }
    }, []);

    const sendText = useCallback((text: string) => {
        // Check for interruption keywords
        const interruptionWords = ['wait', 'stop', 'hold on', 'pause', 'interrupt', 'hold up', 'shut up', 'silence', 'quiet'];
        const isInterruption = interruptionWords.some(word => text.toLowerCase().includes(word));
        
        if (isInterruption) {
            console.log('🛑 INTERRUPTION DETECTED:', text);
            // Stop local playback only — do not send a fake acknowledgment as user input
            audioSources.current.forEach(source => {
                try { source.stop(); } catch { /* already stopped */ }
            });
            audioSources.current.clear();
            nextStartTime.current = 0;
            setOrbState('idle');
            setCurrentAiTranscript('');
            accumulatedOutputRef.current = '';
            // Still forward the user's interrupt words so the model knows to stop
            aiService.current?.sendText(text);
            return;
        }
        
        // Normal text sending
        aiService.current?.sendText(text);
    }, []);

    const updatePersonality = useCallback(() => {
        // Personality prompt + voice are baked in at connect time, so a live session
        // must reconnect for the change to take effect.
        if (orbStateRef.current === 'disconnected') {
            console.log('🎭 Personality change will apply on next connect');
            return;
        }
        console.log('🎭 Personality changed - reconnecting to apply new voice/style');
        disconnect();
        setTimeout(() => {
            connect();
        }, 300);
    }, [connect, disconnect]);

    const setMicrophoneDevice = useCallback(async (deviceId: string) => {
        setSelectedDeviceId(deviceId);
        if (enhancedMicrophone.current) {
            try {
                await enhancedMicrophone.current.setDevice(deviceId);
            } catch (error) {
                console.error('Failed to switch microphone device:', error);
            }
        }
    }, []);

    const getAudioLevel = useCallback(() => {
        return enhancedMicrophone.current?.getAudioLevel() || 0;
    }, []);

    const setMicrophoneGain = useCallback((gain: number) => {
        if (enhancedMicrophone.current) {
            enhancedMicrophone.current.setGain(gain);
        }
    }, []);

    useEffect(() => {
        // Effect dependencies
    }, [connect, disconnect, sendText]);

    return { 
        orbState, 
        transcripts, 
        currentUserTranscript, 
        currentAiTranscript, 
        connect, 
        disconnect, 
        sendText, 
        activeToolUsage, 
        updatePersonality, 
        clearConversationHistory,
        audioLevel,
        availableDevices,
        selectedDeviceId,
        setMicrophoneDevice,
        getAudioLevel,
        setMicrophoneGain
    };
};
