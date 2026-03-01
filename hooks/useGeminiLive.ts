import { useState, useEffect, useRef, useCallback } from 'react';
import { GeminiLiveService } from '../services/ai/geminiLiveService';
import type { AIConversationService } from '../services/ai/aiService';
import { promptService } from '../prompts/promptService';
import { personalityService } from '../services/personalityService';
import { ToolController } from '../tools/toolController';
import type { Transcript } from '../types';
import type { OrbState } from '../components/AssistantOrb';

export const useGeminiLive = (toolController?: ToolController, addThought?: (type: 'thinking' | 'planning' | 'executing' | 'observing', content: string, step?: number, totalSteps?: number) => void) => {
    const [orbState, setOrbState] = useState<OrbState>('disconnected');
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    const [currentUserTranscript, setCurrentUserTranscript] = useState('');
    const [currentAiTranscript, setCurrentAiTranscript] = useState('');
    const [activeToolUsage, setActiveToolUsage] = useState<any>(null);

    const aiService = useRef<AIConversationService | null>(null);
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
            // Initialize AI service
            aiService.current = new GeminiLiveService();

            // Get tool declarations and system instructions
            const toolDeclarations = toolController?.getDeclarations() || [];
            const systemInstructions = promptService.getPrompt();

            // Connect using regular Gemini API
            await aiService.current.connect({
                config: {
                    tools: toolDeclarations,
                    systemInstruction: systemInstructions,
                },
                callbacks: {
                    onopen: () => {
                        console.log('🟢 GEMINI API CONNECTION SUCCESS: Connected successfully!');
                        setOrbState('idle');
                    },
                    onclose: (event?: CloseEvent) => {
                        console.log('🔴 GEMINI API CONNECTION CLOSED: Connection closed.', event ? {
                            code: event.code,
                            reason: event.reason,
                            wasClean: event.wasClean
                        } : 'No close event details');
                        setOrbState('disconnected');
                    }
                }
            });

        } catch (error) {
            console.error('Connection failed:', error);
            setOrbState('disconnected');
            alert(`Connection failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }, [toolController]);

    const disconnect = useCallback(() => {
        console.log('Disconnecting from Gemini API...');

        setOrbState('disconnected');
        orbStateRef.current = 'disconnected';

        if (aiService.current) {
            try {
                aiService.current.close();
            } catch (error) {
                console.log('Error closing AI service:', error);
            }
            aiService.current = null;
        }

        setCurrentUserTranscript('');
        setCurrentAiTranscript('');
    }, []);

    const sendText = useCallback(async (text: string) => {
        if (!aiService.current || orbStateRef.current !== 'idle') {
            console.log('Cannot send text: AI service not ready or not idle');
            return;
        }

        try {
            // Add user message to transcripts
            const userMessage: Transcript = {
                id: crypto.randomUUID(),
                speaker: 'user',
                text: text
            };
            setTranscripts(prev => [...prev, userMessage]);

            setOrbState('processing');
            setCurrentUserTranscript(text);

            // Send text to AI service
            await aiService.current.sendText(text);

            // For now, simulate AI response (since the service doesn't provide real-time streaming yet)
            // In a full implementation, you'd get the response from the service and add it to transcripts
            setTimeout(() => {
                const aiResponse: Transcript = {
                    id: crypto.randomUUID(),
                    speaker: 'ai',
                    text: 'I received your message: ' + text // Placeholder response
                };
                setTranscripts(prev => [...prev, aiResponse]);
                setCurrentAiTranscript(aiResponse.text);
                setCurrentUserTranscript('');
                setOrbState('idle');
            }, 1000);

        } catch (error) {
            console.error('Error sending text:', error);
            setOrbState('idle');
            alert(`Failed to send message: ${error instanceof Error ? error.message : String(error)}`);
        }
    }, []);

    const updatePersonality = useCallback(() => {
        console.log('🎭 Personality change detected - will take effect on next conversation start');
    }, []);

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        orbState,
        transcripts,
        currentUserTranscript,
        currentAiTranscript,
        connect,
        disconnect,
        sendText,
        activeToolUsage,
        updatePersonality
    };
};
