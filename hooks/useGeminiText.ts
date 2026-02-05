import { useState, useEffect, useRef, useCallback } from 'react';
import type { LiveServerMessage } from "@google/genai";
import { GeminiTextService } from '../services/ai/geminiTextService';
import type { AIConversationService } from '../services/ai/aiService';
import { promptService } from '../prompts/promptService';
import { personalityService } from '../services/personalityService';
import { ToolController } from '../tools/toolController';
import type { Transcript } from '../types';
import type { OrbState } from '../components/AssistantOrb';
import { createBlob, decode, decodeAudioData, resampleBuffer } from '../utils/audio';

const INPUT_SAMPLE_RATE = 16000;
const AUDIO_BUFFER_SIZE = 4096;

export const useGeminiText = (toolController?: ToolController, addThought?: (type: 'thinking' | 'planning' | 'executing' | 'observing', content: string, step?: number, totalSteps?: number) => void) => {
    const [orbState, setOrbState] = useState<OrbState>('disconnected');
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    const [currentUserTranscript, setCurrentUserTranscript] = useState('');
    const [currentAiTranscript, setCurrentAiTranscript] = useState('');
    const [isConnected, setIsConnected] = useState(false);

    const aiService = useRef<AIConversationService | null>(null);
    const orbStateRef = useRef<OrbState>('disconnected');
    const currentAiTranscriptRef = useRef('');
    
    // Audio processing refs
    const audioContext = useRef<AudioContext | null>(null);
    const microphoneStream = useRef<MediaStream | null>(null);
    const audioProcessor = useRef<ScriptProcessorNode | null>(null);
    const accumulatedInput = useRef('');

    // Update refs when state changes
    useEffect(() => {
        orbStateRef.current = orbState;
    }, [orbState]);

    useEffect(() => {
        currentAiTranscriptRef.current = currentAiTranscript;
    }, [currentAiTranscript]);

    // Initialize microphone and audio context
    const initializeMicrophone = async () => {
        try {
            audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
            microphoneStream.current = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: INPUT_SAMPLE_RATE
                } 
            });
            console.log('🎤 STT: Microphone initialized');
        } catch (error) {
            console.error('❌ STT: Failed to initialize microphone:', error);
        }
    };

    // Simple voice activity detection
    const detectVoiceActivity = (audioData: Float32Array): boolean => {
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
            sum += Math.abs(audioData[i]);
        }
        const average = sum / audioData.length;
        return average > 0.01; // Threshold for voice detection
    };

    const startMicrophoneProcessing = () => {
        if (!audioContext.current || !microphoneStream.current) return;

        const source = audioContext.current.createMediaStreamSource(microphoneStream.current);
        audioProcessor.current = audioContext.current.createScriptProcessor(AUDIO_BUFFER_SIZE, 1, 1);

        let isSpeaking = false;
        let speechBuffer: Float32Array[] = [];

        audioProcessor.current.onaudioprocess = (event) => {
            const inputData = event.inputBuffer.getChannelData(0);
            const hasVoice = detectVoiceActivity(inputData);

            if (hasVoice && !isSpeaking) {
                // Start of speech
                isSpeaking = true;
                setOrbState('listening');
                speechBuffer = [];
            }

            if (hasVoice && isSpeaking) {
                // During speech
                speechBuffer.push(new Float32Array(inputData));
            }

            if (!hasVoice && isSpeaking) {
                // End of speech
                isSpeaking = false;
                setOrbState('processing');
                
                // Process the collected speech
                if (speechBuffer.length > 0) {
                    const fullBuffer = speechBuffer.flat();
                    speechBuffer = [];
                    
                    // Create a simple text input since we don't have STT
                    // In a real implementation, this would send to a STT service
                    const recognizedText = prompt(`I heard something. What did you want to say?\n\n(Click OK to continue, or type your message):`);
                    
                    if (recognizedText && recognizedText.trim()) {
                        setCurrentUserTranscript(recognizedText);
                        accumulatedInput.current = recognizedText;
                        
                        // Send to AI service
                        if (aiService.current) {
                            aiService.current.sendText(recognizedText);
                        }
                    }
                }
                
                setTimeout(() => setOrbState('idle'), 1000);
            }
        };

        source.connect(audioProcessor.current);
        audioProcessor.current.connect(audioContext.current.destination);
    };

    const connect = useCallback(async () => {
        try {
            setOrbState('connecting');
            console.log('🔌 TEXT SERVICE: Starting connection...');

            // Initialize microphone first
            await initializeMicrophone();

            aiService.current = new GeminiTextService();
            
            // Get conversation history for context
            let conversationContext = '';
            try {
                const recentHistory = transcripts.slice(-5);
                if (recentHistory.length > 0) {
                    conversationContext = '\n\nRECENT CONVERSATION HISTORY:\n' + 
                        recentHistory.map(t => `${t.speaker.toUpperCase()}: ${t.text}`).join('\n');
                }
            } catch (e) {
                console.warn('Failed to parse conversation history:', e);
            }

            await aiService.current.connect({
                callbacks: {
                    onopen: () => {
                        console.log('🟢 TEXT SERVICE: Connection opened successfully!');
                        setOrbState('idle');
                        startMicrophoneProcessing();
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent) {
                            // Handle text responses
                            if (message.text) {
                                setCurrentAiTranscript(message.text);
                                setOrbState('processing');
                                
                                // Add to transcripts
                                setTranscripts(prev => [...prev, {
                                    speaker: 'ai',
                                    text: message.text || '',
                                    timestamp: new Date()
                                }]);
                                
                                // Set back to idle after processing
                                setTimeout(() => {
                                    setOrbState('idle');
                                }, 1000);
                            }
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('❌ TEXT SERVICE: Connection error:', e);
                        alert("Text service connection failed. Please check your API key and try again.");
                        setOrbState('disconnected');
                        disconnect();
                    },
                    onclose: () => {
                        console.log('🔴 TEXT SERVICE: Connection closed');
                        setOrbState('disconnected');
                    },
                },
                config: {
                    systemInstruction: promptService.getSystemInstruction() + conversationContext,
                    tools: [{ functionDeclarations: toolController?.getDeclarations() || [] }],
                }
            });
            
            setIsConnected(true);
            
        } catch (error) {
            console.error('❌ TEXT SERVICE: Failed to connect:', error);
            setOrbState('disconnected');
            alert('Failed to connect to text service. Please check your API key.');
        }
    }, [toolController, transcripts]);

    const disconnect = useCallback(() => {
        if (aiService.current) {
            aiService.current.close();
            aiService.current = null;
        }
        setIsConnected(false);
        setOrbState('disconnected');
    }, []);

    const sendText = useCallback((text: string) => {
        if (aiService.current && isConnected) {
            // Add user transcript
            setCurrentUserTranscript(text);
            setTranscripts(prev => [...prev, {
                speaker: 'user',
                text,
                timestamp: new Date()
            }]);
            
            // Send to AI
            aiService.current.sendText(text);
            setOrbState('processing');
        }
    }, [isConnected]);

    const sendToolResponse = useCallback((toolResponse: any) => {
        if (aiService.current) {
            aiService.current.sendToolResponse(toolResponse);
        }
    }, []);

    // Auto-connect on mount
    useEffect(() => {
        connect();
        return () => disconnect();
    }, []);

    return {
        orbState,
        transcripts,
        currentUserTranscript,
        currentAiTranscript,
        isConnected,
        connect,
        disconnect,
        sendText,
        sendToolResponse,
        aiService: aiService.current
    };
};
