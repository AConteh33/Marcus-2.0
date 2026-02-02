import { useState, useEffect, useRef, useCallback } from 'react';
import type { LiveServerMessage } from "@google/genai";
import { GeminiLiveService } from '../services/ai/geminiLiveService';
import type { AIConversationService } from '../services/ai/aiService';
import { createBlob, decode, decodeAudioData, resampleBuffer } from '../utils/audio';
import { promptService } from '../prompts/promptService';
import { personalityService } from '../services/personalityService';
import { ToolController } from '../tools/toolController';
import type { Transcript } from '../types';
import type { OrbState } from '../components/AssistantOrb';

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const AUDIO_BUFFER_SIZE = 4096;

export const useGeminiLive = (toolController?: ToolController, addThought?: (type: 'thinking' | 'planning' | 'executing' | 'observing', content: string, step?: number, totalSteps?: number) => void) => {
    const [orbState, setOrbState] = useState<OrbState>('disconnected');
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    const [currentUserTranscript, setCurrentUserTranscript] = useState('');
    const [currentAiTranscript, setCurrentAiTranscript] = useState('');
    const [activeToolUsage, setActiveToolUsage] = useState<any>(null);
    
    const aiService = useRef<AIConversationService | null>(null);
    const audioContext = useRef<AudioContext | null>(null);
    const outputAudioContext = useRef<AudioContext | null>(null);
    const microphoneStream = useRef<MediaStream | null>(null);
    const scriptProcessor = useRef<ScriptProcessorNode | null>(null);
    const nextStartTime = useRef(0);
    const audioSources = useRef<Set<AudioBufferSourceNode>>(new Set());

    const accumulatedInputRef = useRef('');
    const accumulatedOutputRef = useRef('');
    
    const orbStateRef = useRef(orbState);
    useEffect(() => {
        orbStateRef.current = orbState;
    }, [orbState]);

    const connect = useCallback(async () => {
        if (orbStateRef.current !== 'idle' && orbStateRef.current !== 'disconnected') {
            console.log('Connect called but already connected or connecting. Current state:', orbStateRef.current);
            return;
        }
        console.log('Initiating connection...');
        setOrbState('connecting');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } });
            microphoneStream.current = stream;

            // Fix: Cast window to any to access webkitAudioContext and resolve TypeScript error.
            audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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

            // Load previous conversation history if available
            const previousConversation = sessionStorage.getItem('marcus_conversation_history');
            let conversationHistory = [];
            let conversationContext = '';
            if (previousConversation) {
                try {
                    conversationHistory = JSON.parse(previousConversation);
                    setTranscripts(conversationHistory);
                    
                    // Build conversation context for system instruction
                    const recentHistory = conversationHistory.slice(-6); // Last 6 exchanges
                    conversationContext = '\n\nRECENT CONVERSATION HISTORY:\n' + 
                        recentHistory.map(t => `${t.speaker.toUpperCase()}: ${t.text}`).join('\n');
                } catch (e) {
                    console.warn('Failed to parse conversation history:', e);
                }
            }

            aiService.current.connect({
                callbacks: {
                    onopen: () => {
                        console.log('Connection opened.');
                        setOrbState('idle');
                        startMicrophoneProcessing();
                        // Only send greeting if no previous conversation
                        if (conversationHistory.length === 0) {
                            setTimeout(() => {
                                const greeting = "Hello! I'm Marcus, your AI homie. What's good?";
                                aiService.current?.sendText(greeting);
                            }, 500);
                        } else {
                            // Continue conversation context
                            setTimeout(() => {
                                const contextMsg = "I'm back. Let's continue where we left off.";
                                aiService.current?.sendText(contextMsg);
                            }, 500);
                        }
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

                                setTranscripts(prev => {
                                    const newHistory = [...prev];
                                    if (finalInput) {
                                        newHistory.push({ id: crypto.randomUUID(), speaker: 'user', text: finalInput });
                                    }
                                    if (finalOutput) {
                                        newHistory.push({ id: crypto.randomUUID(), speaker: 'ai', text: finalOutput });
                                    }
                                    // Save conversation history to sessionStorage
                                    try {
                                        sessionStorage.setItem('marcus_conversation_history', JSON.stringify(newHistory));
                                    } catch (e) {
                                        console.warn('Failed to save conversation history:', e);
                                    }
                                    return newHistory;
                                });
                                
                                accumulatedInputRef.current = '';
                                accumulatedOutputRef.current = '';
                                setCurrentUserTranscript('');
                                setCurrentAiTranscript('');
                                setOrbState('idle');
                            }

                            // Handle audio playback
                            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                            if (audioData && outputAudioContext.current) {
                                setOrbState('speaking');
                                const decodedBytes = decode(audioData);
                                const audioBuffer = await decodeAudioData(decodedBytes, outputAudioContext.current, OUTPUT_SAMPLE_RATE, 1);
                                
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
                                    if (audioSources.current.size === 0 && orbStateRef.current !== 'processing') {
                                        setOrbState('idle');
                                    }
                                };
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
                            
                            for (const fc of message.toolCall.functionCalls) {
                                addThought?.('executing', `Executing: ${fc.name}`);
                                const result = await toolController.executeTool(fc.name, fc.args);

                                // Show tool results in sidebar instead of chat
                                setActiveToolUsage({
                                    toolName: fc.name,
                                    args: fc.args,
                                    result: result,
                                    timestamp: new Date()
                                });
                                
                                addThought?.('thinking', `Result: ${result.substring(0, 50)}${result.length > 50 ? '...' : ''}`);

                                if (fc.name === 'endSession') {
                                    disconnect();
                                    return;
                                }
                                const toolResponse = {
                                    functionResponses: {
                                        id: fc.id,
                                        name: fc.name,
                                        response: { result: result },
                                    }
                                };
                                aiService.current?.sendToolResponse(toolResponse);
                            }
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Connection error:', e);
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
                        
                        // Handle specific error codes
                        if (event) {
                            if (event.code === 1011) {
                                // Quota exceeded or billing issue
                                const reason = event.reason || '';
                                if (reason.includes('quota') || reason.includes('billing')) {
                                    alert('API Quota Exceeded: You have exceeded your current Gemini API quota. Please check your plan and billing details at https://aistudio.google.com/apikey');
                                } else {
                                    alert(`Connection closed: ${reason}`);
                                }
                            } else if (event.code === 1006) {
                                // Abnormal closure (could be network or auth issue)
                                if (!event.reason) {
                                    alert('Connection closed unexpectedly. This may indicate a network issue or authentication problem.');
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
                    systemInstruction: promptService.getSystemInstruction() + conversationContext,
                    tools: [{ functionDeclarations: toolController.getDeclarations() }],
                }
            });
        } catch (error) {
            console.error('Failed to start session:', error);
            setOrbState('disconnected');
        }
    }, [toolController]);

    const startMicrophoneProcessing = () => {
        if (!audioContext.current || !microphoneStream.current || !aiService.current) return;

        const source = audioContext.current.createMediaStreamSource(microphoneStream.current);
        scriptProcessor.current = audioContext.current.createScriptProcessor(AUDIO_BUFFER_SIZE, 1, 1);

        scriptProcessor.current.onaudioprocess = (audioProcessingEvent) => {
            // Prevent feedback loop by not processing audio while the AI is speaking.
            if (orbStateRef.current === 'speaking' || !audioContext.current) {
                return;
            }
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const resampledData = resampleBuffer(inputData, audioContext.current.sampleRate, INPUT_SAMPLE_RATE);
            const pcmBlob = createBlob(resampledData);
            aiService.current?.sendAudio(pcmBlob);
        };
        source.connect(scriptProcessor.current);
        scriptProcessor.current.connect(audioContext.current.destination);
    };

    const stopMicrophoneProcessing = () => {
        // Force stop all audio processing
        if (scriptProcessor.current) {
            try {
                scriptProcessor.current.disconnect();
                scriptProcessor.current.onaudioprocess = null;
            } catch (error) {
                console.log('Error disconnecting script processor:', error);
            }
            scriptProcessor.current = null;
        }
        
        // Force stop all audio sources
        if (audioContext.current) {
            try {
                // Suspend audio context to stop all audio
                audioContext.current.suspend();
            } catch (error) {
                console.log('Error suspending audio context:', error);
            }
        }
    };

    const disconnect = useCallback(() => {
        console.log('FORCE CANCEL - Stopping everything immediately...');
        
        // Set state to disconnected immediately to prevent any further processing
        setOrbState('disconnected');
        orbStateRef.current = 'disconnected';
        
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
        
        // Force stop all microphone streams
        if (microphoneStream.current) {
            microphoneStream.current.getTracks().forEach(track => {
                try {
                    track.stop();
                } catch (error) {
                    console.log('Error stopping microphone track:', error);
                }
            });
            microphoneStream.current = null;
        }
        
        // Force close all audio contexts multiple times to ensure they're stopped
        [audioContext.current, outputAudioContext.current].forEach(context => {
            if (context) {
                try {
                    context.suspend();
                    context.close();
                } catch (error) {
                    console.log('Error closing audio context:', error);
                }
            }
        });
        audioContext.current = null;
        outputAudioContext.current = null;
        
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

    const sendText = useCallback((text: string) => {
        // Check for interruption keywords
        const interruptionWords = ['wait', 'stop', 'hold on', 'pause', 'interrupt', 'hold up', 'shut up', 'silence', 'quiet'];
        const isInterruption = interruptionWords.some(word => text.toLowerCase().includes(word));
        
        if (isInterruption) {
            console.log('🛑 INTERRUPTION DETECTED:', text);
            // Send interruption acknowledgment
            aiService.current?.sendText('Got it. On hold. Waiting for your next instruction.');
            return;
        }
        
        // Normal text sending
        aiService.current?.sendText(text);
    }, []);

    const updatePersonality = useCallback(() => {
        // This function is disabled - personality changes should only take effect
        // when starting a new conversation to avoid confusion and mixed personalities
        console.log('🎭 Personality change detected - will take effect on next conversation start');
    }, []);

    useEffect(() => {
        // Effect dependencies
    }, [connect, disconnect, sendText]);
    return { orbState, transcripts, currentUserTranscript, currentAiTranscript, connect, disconnect, sendText, activeToolUsage, updatePersonality };
};
