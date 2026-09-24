import { encode } from '../../utils/audio';

export interface MicrophoneOptions {
  sampleRate?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  deviceId?: string;
  onAudioLevel?: (level: number) => void;
  onError?: (error: Error) => void;
}

export class EnhancedMicrophone {
  private audioContext: AudioContext | null = null;
  private microphoneStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private isActive = false;
  private options: MicrophoneOptions;
  private audioBuffer: Float32Array = new Float32Array(0);
  private audioLevelInterval: ReturnType<typeof setInterval> | null = null;
  private processCount = 0;
  private hasNewAudio = false;

  constructor(options: MicrophoneOptions = {}) {
    this.options = {
      sampleRate: 16000,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      ...options
    };
  }

  async initialize(): Promise<void> {
    console.log('[Mic] Initializing...');

    try {
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: this.options.echoCancellation,
          noiseSuppression: this.options.noiseSuppression,
          autoGainControl: this.options.autoGainControl,
          ...(this.options.deviceId && { deviceId: { exact: this.options.deviceId } })
        }
      });

      this.audioContext = new AudioContext({ sampleRate: this.options.sampleRate });
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(this.microphoneStream);
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 15.0;
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.scriptProcessor.onaudioprocess = (event) => {
        if (!this.isActive) return;

        const inputData = event.inputBuffer.getChannelData(0);
        const inputSampleRate = this.audioContext!.sampleRate;
        const outputSampleRate = this.options.sampleRate || 16000;

        if (inputSampleRate === outputSampleRate) {
          this.audioBuffer = new Float32Array(inputData);
        } else {
          const ratio = inputSampleRate / outputSampleRate;
          const outputLength = Math.round(inputData.length / ratio);
          const resampled = new Float32Array(outputLength);
          for (let i = 0; i < outputLength; i++) {
            const index = Math.floor(i * ratio);
            resampled[i] = inputData[Math.min(index, inputData.length - 1)];
          }
          this.audioBuffer = resampled;
        }
        this.hasNewAudio = true;
      };

      this.sourceNode.connect(this.gainNode);
      this.gainNode.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.analyserNode);
      this.scriptProcessor.connect(this.audioContext.destination);

      this.startAudioLevelMonitoring();
      this.isActive = true;
      console.log('[Mic] Initialized');

    } catch (error) {
      console.warn('[Mic] Failed to initialize:', error);
      this.isActive = false;
    }
  }

  private startAudioLevelMonitoring(): void {
    if (!this.analyserNode) return;

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

    this.audioLevelInterval = setInterval(() => {
      if (!this.analyserNode || !this.isActive) return;

      this.analyserNode.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const normalizedLevel = average / 255;

      this.options.onAudioLevel?.(normalizedLevel);
    }, 100);
  }

  getAudioLevel(): number {
    if (!this.analyserNode) return 0;

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    return average / 255;
  }

  setGain(gain: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(20, gain));
    }
  }

  getGain(): number {
    return this.gainNode?.gain.value ?? 1;
  }

  async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
    if (!navigator.mediaDevices) return [];
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'audioinput');
  }

  async setDevice(deviceId: string): Promise<void> {
    if (!this.isActive) {
      this.options.deviceId = deviceId;
      return;
    }

    this.stop();
    this.options.deviceId = deviceId;
    await this.initialize();
  }

  getProcessedAudio(): { data: string; mimeType: string } | null {
    if (!this.isActive || this.audioBuffer.length === 0 || !this.hasNewAudio) {
      return null;
    }
    this.hasNewAudio = false;

    const int16 = new Int16Array(this.audioBuffer.length);
    for (let i = 0; i < this.audioBuffer.length; i++) {
      int16[i] = Math.max(-32768, Math.min(32767, this.audioBuffer[i] * 32768));
    }

    const uint8Array = new Uint8Array(int16.buffer);
    const base64Data = encode(uint8Array);

    return {
      data: base64Data,
      mimeType: `audio/pcm;rate=${this.options.sampleRate}`
    };
  }

  stop(): void {
    this.isActive = false;

    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor.onaudioprocess = null;
      this.scriptProcessor = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop());
      this.microphoneStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.audioBuffer = new Float32Array(0);
  }

  isInitialized(): boolean {
    return this.isActive;
  }

  getSampleRate(): number {
    return this.options.sampleRate || 16000;
  }
}
