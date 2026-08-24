/**
 * Web Audio API Engine & Media Player for Kungnoi Y. Album
 * Supports real MP3/WAV/OGG/M4A audio playback with real-time AnalyserNode Audio Spectrum,
 * responsive mobile audio unlocking (iOS/Android), and rich Dreamy Soul Pop / R&B audio synthesis.
 */

import { getAudioBlobUrl } from './audioStorage';

class AudioSynthEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private currentTrackId: string | null = null;
  private currentTime = 0;
  private duration = 268; // default
  private volume = 0.8;
  private intervalId: number | null = null;
  private masterGain: GainNode | null = null;
  public analyser: AnalyserNode | null = null;
  private listeners: Set<() => void> = new Set();
  private chordTimer: number | null = null;

  // Real Audio Element playback for MP3/WAV audio files
  private audioElement: HTMLAudioElement | null = null;
  private mediaSourceNode: MediaElementAudioSourceNode | null = null;
  private activeAudioUrl: string | null = null;
  private objectUrlToRevoke: string | null = null;
  private isUsingRealAudio = false;
  private onEndedCallback: (() => void) | null = null;
  private isUnlocked = false;

  constructor() {
    this.setupMobileUnlock();
  }

  // Setup mobile user-gesture unlock for iOS Safari and Android Chrome
  private setupMobileUnlock() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.initContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      this.isUnlocked = true;
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('touchend', unlock);
      window.removeEventListener('click', unlock);
    };

    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('touchend', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });
  }

  private initContext() {
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 128;
        this.analyser.smoothingTimeConstant = 0.8;

        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
      } catch (err) {
        console.warn('AudioContext initialization warning:', err);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setOnEndedCallback(callback: (() => void) | null) {
    this.onEndedCallback = callback;
  }

  private triggerOnEnded() {
    this.notify();
    if (this.onEndedCallback) {
      this.onEndedCallback();
    }
  }

  public subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  public async playTrack(
    trackId: string,
    durationSeconds: number,
    rootNote = 58,
    bpm = 108,
    style = 'rnb_pop',
    audioUrl?: string,
    trackNumber?: number
  ) {
    this.initContext();

    const isSameTrack = this.currentTrackId === trackId;

    if (!isSameTrack) {
      this.currentTrackId = trackId;
      this.currentTime = 0;
      this.duration = durationSeconds || 240;
    }

    this.isPlaying = true;

    // Check if custom audioUrl is provided (e.g. from IndexedDB or explicit link)
    let playedSuccessfully = false;

    if (audioUrl && audioUrl.trim() !== '') {
      playedSuccessfully = await this.playRealAudio(audioUrl.trim(), isSameTrack);
    }

    // If explicit audioUrl was not present or failed, try candidate audio files in /audio/
    if (!playedSuccessfully && !audioUrl?.startsWith('idb://')) {
      const num = trackNumber || parseInt(trackId.replace(/\D/g, ''), 10) || 1;
      const numPadded = num < 10 ? `0${num}` : `${num}`;

      const candidateVariants = [
        `/audio/${numPadded}.mp3.mp3`,
        `/audio/${numPadded}.mp3`,
        `/audio/${num}.mp3.mp3`,
        `/audio/${num}.mp3`,
        `/audio/track-${numPadded}.mp3`,
        `/audio/track-${num}.mp3`,
      ];

      for (const candidate of candidateVariants) {
        const success = await this.playRealAudio(candidate, isSameTrack);
        if (success) {
          playedSuccessfully = true;
          break;
        }
      }
    }

    if (!playedSuccessfully) {
      // Fallback to high-quality procedural audio synthesis
      this.stopRealAudio();
      this.isUsingRealAudio = false;
      this.startTimer();
      this.startAudioSynthesis(rootNote, bpm, style);
    }

    this.notify();
  }

  public togglePlayPause(
    trackId: string,
    durationSeconds: number,
    rootNote = 58,
    bpm = 108,
    style = 'rnb_pop',
    audioUrl?: string
  ) {
    if (this.isPlaying && this.currentTrackId === trackId) {
      this.pause();
    } else {
      this.playTrack(trackId, durationSeconds, rootNote, bpm, style, audioUrl);
    }
  }

  private initAudioElement() {
    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.preload = 'auto';
      // Required for mobile background / inline playback
      this.audioElement.setAttribute('playsinline', 'true');
      this.audioElement.setAttribute('webkit-playsinline', 'true');

      this.audioElement.onended = () => {
        this.isPlaying = false;
        this.currentTime = 0;
        this.triggerOnEnded();
      };

      this.audioElement.ontimeupdate = () => {
        if (this.audioElement && this.isUsingRealAudio) {
          this.currentTime = Math.floor(this.audioElement.currentTime);
          if (this.audioElement.duration && !isNaN(this.audioElement.duration) && this.audioElement.duration > 0) {
            this.duration = Math.floor(this.audioElement.duration);
          }
          this.notify();
        }
      };

      this.audioElement.onerror = (e) => {
        console.warn('Real audio file error or 404, fallback to rich synth:', e);
        this.isUsingRealAudio = false;
      };

      // Connect HTMLAudioElement to Web Audio AnalyserNode for live Audio Spectrum
      if (this.ctx && this.masterGain && this.analyser) {
        try {
          if (!this.mediaSourceNode) {
            this.mediaSourceNode = this.ctx.createMediaElementSource(this.audioElement);
            this.mediaSourceNode.connect(this.masterGain);
          }
        } catch (err) {
          console.warn('Could not create MediaElementSource (possibly CORS or mobile security):', err);
        }
      }
    }
  }

  private async playRealAudio(audioUrl: string, isSameTrack: boolean): Promise<boolean> {
    this.stopAudioSynthesis();
    this.stopTimer();
    this.initContext();
    this.initAudioElement();

    if (!this.audioElement) return false;

    let srcToPlay = audioUrl;

    if (audioUrl.startsWith('idb://')) {
      const idbKey = audioUrl.replace('idb://', '');
      const blobUrl = await getAudioBlobUrl(idbKey);
      if (blobUrl) {
        srcToPlay = blobUrl;
      } else {
        return false;
      }
    } else if (audioUrl.startsWith('/') && !audioUrl.startsWith('//')) {
      try {
        const resp = await fetch(audioUrl, { method: 'HEAD' });
        if (!resp.ok) {
          return false;
        }
      } catch {
        // Continue to audio element check
      }
    }

    if (this.activeAudioUrl !== audioUrl || !isSameTrack || this.audioElement.src !== srcToPlay) {
      if (this.objectUrlToRevoke && this.objectUrlToRevoke !== srcToPlay) {
        URL.revokeObjectURL(this.objectUrlToRevoke);
        this.objectUrlToRevoke = null;
      }

      if (srcToPlay.startsWith('blob:')) {
        this.objectUrlToRevoke = srcToPlay;
      }

      this.activeAudioUrl = audioUrl;
      this.audioElement.src = srcToPlay;
      this.audioElement.currentTime = isSameTrack ? this.currentTime : 0;
    }

    this.isUsingRealAudio = true;
    this.audioElement.volume = this.volume;

    try {
      if (this.ctx && this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      await this.audioElement.play();
      return true;
    } catch (err) {
      console.warn('Real audio playback failed, falling back to synth engine:', err);
      this.isUsingRealAudio = false;
      return false;
    }
  }

  private stopRealAudio() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  public pause() {
    this.isPlaying = false;
    this.stopAudioSynthesis();
    this.stopTimer();
    this.stopRealAudio();
    this.notify();
  }

  public seek(seconds: number) {
    this.currentTime = Math.max(0, Math.min(seconds, this.duration));
    if (this.isUsingRealAudio && this.audioElement) {
      this.audioElement.currentTime = this.currentTime;
    }
    this.notify();
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(vol, 1));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
    this.notify();
  }

  public getState() {
    return {
      isPlaying: this.isPlaying,
      currentTrackId: this.currentTrackId,
      currentTime: this.currentTime,
      duration: this.duration,
      volume: this.volume,
      isUsingRealAudio: this.isUsingRealAudio,
    };
  }

  private startTimer() {
    this.stopTimer();
    this.intervalId = window.setInterval(() => {
      if (this.isPlaying && !this.isUsingRealAudio) {
        this.currentTime += 1;
        if (this.currentTime >= this.duration) {
          this.currentTime = 0;
          this.triggerOnEnded();
        } else {
          this.notify();
        }
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // High-Quality Multi-Layer Procedural Synthesizer for Dreamy Soul Pop / R&B Pop
  private startAudioSynthesis(rootNote: number, bpm: number, style: string) {
    this.stopAudioSynthesis();
    if (!this.ctx || !this.masterGain) return;

    // 2 beats per chord step
    const intervalMs = Math.max(300, (60 / bpm) * 1000 * 2);
    let step = 0;

    // Harmonic chords adapted to key & style
    // For Bb Minor (rootNote=58): Bbm7, Ebm7, F7, Gbmaj7
    const chordOffsets =
      style === 'rnb_pop' || style === 'soul_pop'
        ? [
            [0, 3, 7, 10, 14], // Bbm9 / Min9
            [5, 8, 12, 15],    // Ebm7 / Subdominant
            [7, 11, 14, 17],   // F7 / Dominant
            [8, 12, 15, 19],   // Gbmaj7 / Relative Major
          ]
        : style === 'dreamy_pop'
        ? [
            [0, 7, 10, 14],
            [5, 9, 12, 15],
            [-2, 2, 7, 10],
            [3, 7, 10, 14],
          ]
        : [
            [0, 3, 7, 10],
            [5, 8, 12],
            [7, 11, 14],
            [8, 12, 15],
          ];

    const triggerChord = () => {
      if (!this.ctx || !this.masterGain || !this.isPlaying || this.isUsingRealAudio) return;

      const now = this.ctx.currentTime;
      const currentChord = chordOffsets[step % chordOffsets.length];
      step++;

      // 1. Lush Electric Piano / Synth Pad
      currentChord.forEach((offset, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        const freq = 440 * Math.pow(2, (rootNote + offset - 69) / 12);
        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200 + idx * 250, now);
        filter.Q.setValueAtTime(1.5, now);

        noteGain.gain.setValueAtTime(0.001, now);
        noteGain.gain.exponentialRampToValueAtTime(0.18 / (idx + 1.2), now + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + (intervalMs / 1000) * 0.95);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + intervalMs / 1000);
      });

      // 2. Warm R&B Sub Bass
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const bassFreq = 440 * Math.pow(2, (rootNote - 12 + currentChord[0] - 69) / 12);

      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(bassFreq, now);

      bassGain.gain.setValueAtTime(0.28, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + (intervalMs / 1000) * 0.85);

      bassOsc.connect(bassGain);
      bassGain.connect(this.masterGain);

      bassOsc.start(now);
      bassOsc.stop(now + (intervalMs / 1000) * 0.9);

      // 3. Crisp R&B Hi-Hat & Snap on off-beat
      setTimeout(() => {
        if (!this.ctx || !this.masterGain || !this.isPlaying || this.isUsingRealAudio) return;
        const subNow = this.ctx.currentTime;
        const hatOsc = this.ctx.createOscillator();
        const hatGain = this.ctx.createGain();
        const hatFilter = this.ctx.createBiquadFilter();

        hatOsc.type = 'square';
        hatOsc.frequency.setValueAtTime(3200 + (step % 2) * 1200, subNow);

        hatFilter.type = 'highpass';
        hatFilter.frequency.setValueAtTime(2500, subNow);

        hatGain.gain.setValueAtTime(0.04, subNow);
        hatGain.gain.exponentialRampToValueAtTime(0.0001, subNow + 0.07);

        hatOsc.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(this.masterGain);

        hatOsc.start(subNow);
        hatOsc.stop(subNow + 0.08);
      }, intervalMs / 2);
    };

    triggerChord();
    this.chordTimer = window.setInterval(triggerChord, intervalMs);
  }

  private stopAudioSynthesis() {
    if (this.chordTimer !== null) {
      clearInterval(this.chordTimer);
      this.chordTimer = null;
    }
  }

  // Real-time Audio Spectrum Frequency Data
  public getFrequencyData(): number[] {
    if (!this.isPlaying) {
      return Array(16).fill(10);
    }

    if (this.analyser) {
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteFrequencyData(dataArray);

      // Check if actual Web Audio analyser has active frequency data
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }

      if (sum > 10) {
        const result: number[] = [];
        const step = Math.floor(bufferLength / 16) || 1;
        for (let i = 0; i < 16; i++) {
          const val = dataArray[i * step] || 0;
          result.push(Math.max(12, Math.min(100, Math.floor((val / 255) * 100))));
        }
        return result;
      }
    }

    // Dynamic rhythmic fallback visualizer when using isolated audio elements or cross-origin media
    const t = Date.now() / 150;
    const result: number[] = [];
    for (let i = 0; i < 16; i++) {
      const wave1 = Math.sin(t + i * 0.4) * 30;
      const wave2 = Math.cos(t * 1.5 + i * 0.3) * 20;
      const beat = (Math.sin(t * 2) > 0.6 ? 25 : 0) * (i < 6 ? 1.4 : 0.6);
      const val = Math.max(15, Math.min(95, Math.floor(40 + wave1 + wave2 + beat)));
      result.push(val);
    }
    return result;
  }
}

export const audioSynth = new AudioSynthEngine();
