export interface TTSService {
    /**
     * Synthesizes speech from the given text.
     * @param text The text to convert to speech.
     * @param voiceName Optional voice name for TTS synthesis.
     * @returns A promise that resolves to a base64 encoded audio string, or null if synthesis fails.
     */
    synthesize(text: string, voiceName?: string): Promise<string | null>;
}
