export class SoundEffects {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private isInitialized = false;

  constructor() {
    // Don't create audio context immediately - wait for user interaction
  }

  private ensureAudioContext() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('Audio context created successfully');
      } catch (error) {
        console.warn('Audio context not supported:', error);
      }
    }
    
    // Resume audio context if it was suspended
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
      console.log('Audio context resumed');
    }
  }

  private createSyntheticSound(type: string): AudioBuffer | null {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    let buffer: AudioBuffer;

    switch (type) {
      case 'activate':
        buffer = this.audioContext.createBuffer(2, sampleRate * 0.3, sampleRate);
        this.generateActivateSound(buffer);
        break;
      case 'deactivate':
        buffer = this.audioContext.createBuffer(2, sampleRate * 0.4, sampleRate);
        this.generateDeactivateSound(buffer);
        break;
      case 'hover':
        buffer = this.audioContext.createBuffer(2, sampleRate * 0.1, sampleRate);
        this.generateHoverSound(buffer);
        break;
      case 'click':
        buffer = this.audioContext.createBuffer(2, sampleRate * 0.15, sampleRate);
        this.generateClickSound(buffer);
        break;
      case 'processing':
        buffer = this.audioContext.createBuffer(2, sampleRate * 0.2, sampleRate);
        this.generateProcessingSound(buffer);
        break;
      case 'notification':
        buffer = this.audioContext.createBuffer(2, sampleRate * 0.25, sampleRate);
        this.generateNotificationSound(buffer);
        break;
      default:
        return null;
    }

    return buffer;
  }

  private generateActivateSound(buffer: AudioBuffer) {
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        const t = i / buffer.sampleRate;
        const freq = 800 + Math.sin(t * 10) * 200;
        const envelope = Math.exp(-t * 3) * (1 - Math.exp(-t * 20));
        channelData[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
      }
    }
  }

  private generateDeactivateSound(buffer: AudioBuffer) {
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        const t = i / buffer.sampleRate;
        const freq = 400 - t * 200;
        const envelope = Math.exp(-t * 2) * (1 - Math.exp(-t * 15));
        channelData[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.2;
      }
    }
  }

  private generateHoverSound(buffer: AudioBuffer) {
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        const t = i / buffer.sampleRate;
        
        // PlayStation-style hover: clean, slightly ascending tone with harmonics
        const baseFreq = 880; // A5 note - clean and bright
        const harmonic1 = baseFreq * 2; // octave
        const harmonic2 = baseFreq * 2.99; // major third harmonic
        
        // Slight frequency sweep for that "whoosh" effect
        const freqSweep = 1 + t * 0.15;
        
        // Quick attack with smooth decay - characteristic of PlayStation UI
        const attack = Math.exp(-t * 30); // quick attack
        const decay = Math.exp(-t * 12); // smooth decay
        const envelope = attack * decay;
        
        // Mix fundamental with harmonics for richer sound
        const fundamental = Math.sin(2 * Math.PI * baseFreq * freqSweep * t) * 0.6;
        const octave = Math.sin(2 * Math.PI * harmonic1 * freqSweep * t) * 0.3;
        const third = Math.sin(2 * Math.PI * harmonic2 * freqSweep * t) * 0.1;
        
        channelData[i] = (fundamental + octave + third) * envelope * 0.2;
      }
    }
  }

  private generateClickSound(buffer: AudioBuffer) {
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        const t = i / buffer.sampleRate;
        const freq = 1500;
        const envelope = Math.exp(-t * 15) * (1 - Math.exp(-t * 50));
        channelData[i] = (Math.random() - 0.5) * Math.sin(2 * Math.PI * freq * t) * envelope * 0.2;
      }
    }
  }

  private generateProcessingSound(buffer: AudioBuffer) {
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        const t = i / buffer.sampleRate;
        const freq = 600 + Math.sin(t * 20) * 150 + Math.sin(t * 40) * 50;
        const envelope = Math.sin(t * Math.PI) * 0.2;
        channelData[i] = Math.sin(2 * Math.PI * freq * t) * envelope;
      }
    }
  }

  private generateNotificationSound(buffer: AudioBuffer) {
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        const t = i / buffer.sampleRate;
        const freq1 = 800;
        const freq2 = 1200;
        const envelope = Math.exp(-t * 2) * (1 - Math.exp(-t * 10));
        channelData[i] = (
          Math.sin(2 * Math.PI * freq1 * t) * 0.5 +
          Math.sin(2 * Math.PI * freq2 * t) * 0.5
        ) * envelope * 0.25;
      }
    }
  }

  play(soundType: string) {
    this.ensureAudioContext();
    
    if (!this.audioContext) {
      console.warn('Cannot play sound: Audio context not available');
      return;
    }

    console.log(`Playing sound: ${soundType}`);
    
    let buffer = this.sounds.get(soundType);
    if (!buffer) {
      buffer = this.createSyntheticSound(soundType);
      if (buffer) {
        this.sounds.set(soundType, buffer);
        console.log(`Created and cached sound: ${soundType}`);
      } else {
        console.warn(`Failed to create sound: ${soundType}`);
        return;
      }
    }

    try {
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0.5;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      source.start(0);
      console.log(`Sound played successfully: ${soundType}`);
    } catch (error) {
      console.error(`Error playing sound ${soundType}:`, error);
    }
  }

  playHover() {
    this.play('hover');
  }

  playClick() {
    this.play('click');
  }

  playActivate() {
    this.play('activate');
  }

  playDeactivate() {
    this.play('deactivate');
  }

  playProcessing() {
    this.play('processing');
  }

  playNotification() {
    this.play('notification');
  }

  // Test method for debugging
  testHoverSound() {
    console.log('Testing hover sound...');
    this.playHover();
  }
}

export const soundEffects = new SoundEffects();
