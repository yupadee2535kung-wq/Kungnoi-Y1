/**
 * Web Audio API Engine & Media Player for Kungnoi Y. Album
 * Supports real MP3/WAV/OGG/M4A audio playback with real-time AnalyserNode Audio Spectrum,
 * responsive mobile audio unlocking (iOS/Android), and rich Dreamy Soul Pop / R&B audio synthesis.
 */

import { getAudioBlobUrl } from './audioStorage';

// Conversion: MIDI Note number to Frequency in Hz
function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

class AudioSynthEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private currentTrackId: string | null = null;
  private currentTime = 0;
  private duration = 240; // default
  private volume = 0.8;
  private intervalId: number | null = null;
  private masterGain: GainNode | null = null;
  public analyser: AnalyserNode | null = null;
  private listeners: Set<() => void> = new Set();
  private chordTimer: number | null = null;
  private beatTimer: number | null = null;
  private activeVoices: { osc: OscillatorNode; gain: GainNode }[] = [];

  // Real Audio Element playback for MP3/WAV audio files
  private audioElement: HTMLAudioElement | null = null;
  private activeAudioUrl: string | null = null;
  private objectUrlToRevoke: string | null = null;
  private isUsingRealAudio = false;
  private onEndedCallback: (() => void) | null = null;

  constructor() {
    this.setupMobileUnlock();
  }

  // Setup mobile user-gesture unlock for iOS Safari and Android Chrome
  private setupMobileUnlock() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.ensureContext().then((ctx) => {
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      });
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('touchend', unlock);
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('touchend', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  public async ensureContext(): Promise<AudioContext | null> {
    if (typeof window === 'undefined') return null;

    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
        
        this.masterGain = this.ctx.createGain();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 128;
        this.analyser.smoothingTimeConstant = 0.8;

        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      if (this.masterGain) {
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      }

      return this.ctx;
    } catch (err) {
      console.warn('AudioContext initialization warning:', err);
      return null;
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
    this.listeners.forEach((cb) => cb());
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
    await this.ensureContext();

    const isSameTrack = this.currentTrackId === trackId;

    if (!isSameTrack) {
      this.currentTrackId = trackId;
      this.currentTime = 0;
      this.duration = durationSeconds || 240;
    }

    this.isPlaying = true;

    // 1. Try real audio if provided
    let playedSuccessfully = false;

    if (audioUrl && audioUrl.trim() !== '') {
      playedSuccessfully = await this.playRealAudio(audioUrl.trim(), isSameTrack);
    }

    // 2. If no real audio or playback failed, immediately start procedural studio audio
    if (!playedSuccessfully) {
      this.stopRealAudio();
      this.isUsingRealAudio = false;
      this.startTimer();
      this.startAudioSynthesis(rootNote, bpm, style, trackNumber || 1);
    }

    this.notify();
  }

  public togglePlayPause(
    trackId: string,
    durationSeconds: number,
    rootNote = 58,
    bpm = 108,
    style = 'rnb_pop',
    audioUrl?: string,
    trackNumber?: number
  ) {
    if (this.isPlaying && this.currentTrackId === trackId) {
      this.pause();
    } else {
      this.playTrack(trackId, durationSeconds, rootNote, bpm, style, audioUrl, trackNumber);
    }
  }

  private initAudioElement() {
    if (!this.audioElement && typeof window !== 'undefined') {
      this.audioElement = new Audio();
      this.audioElement.preload = 'auto';
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

      this.audioElement.onerror = () => {
        this.isUsingRealAudio = false;
      };
    }
  }

  private async playRealAudio(audioUrl: string, isSameTrack: boolean): Promise<boolean> {
    this.stopAudioSynthesis();
    this.stopTimer();
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
        return false;
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
      await this.audioElement.play();
      return true;
    } catch {
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

  /**
   * Rich Multi-Layer Procedural Synthesizer
   * Creates lush chord progressions, acoustic strumming, soulful lead melodies,
   * warm basslines, and rhythmic beat per track.
   */
  private startAudioSynthesis(rootNote: number, bpm: number, style: string, trackNum = 1) {
    this.stopAudioSynthesis();
    if (!this.ctx || !this.masterGain) return;

    // Beat timing
    const beatIntervalMs = Math.max(250, (60 / bpm) * 1000);
    const chordIntervalMs = beatIntervalMs * 4; // 4 beats per bar
    let barIndex = 0;
    let beatIndex = 0;

    // Harmonic Chord Progressions by Track & Style
    // Chords are arrays of semitone offsets from rootNote
    const progressions: Record<string, number[][]> = {
      soul_pop: [
        [0, 4, 7, 11, 14],   // Maj9 (Fmaj9)
        [9, 12, 16, 19],     // Min7 (Dm7)
        [2, 5, 9, 12],       // Min7 (Gm7)
        [7, 11, 14, 17],     // Dom7 (C7)
      ],
      rnb_pop: [
        [0, 3, 7, 10, 14],   // Min9 (Bbm9)
        [5, 8, 12, 15],      // Min7 (Ebm7)
        [8, 12, 15, 19],     // Maj7 (Gbmaj7)
        [7, 11, 14, 17],     // Dom7 (F7)
      ],
      pop_rock: [
        [0, 3, 7, 10],       // Gm
        [8, 12, 15, 19],     // Eb
        [3, 7, 10, 14],      // Bb
        [5, 9, 12, 15],      // F
      ],
      ambient_ballad: [
        [0, 3, 7, 10, 14],   // Cm9
        [8, 12, 15, 19],     // Abmaj7
        [5, 8, 12, 15],      // Fm7
        [7, 10, 14, 17],     // G7sus
      ],
      dreamy_pop: [
        [0, 4, 7, 11, 14],   // Ebmaj9
        [5, 9, 12, 16],      // Abmaj7
        [2, 5, 9, 12],       // Fm7
        [7, 11, 14, 17],     // Bb7
      ],
      acoustic_pop: [
        [0, 4, 7, 11],       // Abmaj7
        [9, 12, 16, 19],     // Fm7
        [2, 5, 9, 12],       // Bbm7
        [7, 11, 14, 17],     // Eb7
      ],
      modern_rnb: [
        [0, 3, 7, 10, 14],   // Dm9
        [8, 12, 15, 19],     // Bbmaj7
        [3, 7, 10, 14],      // Gm7
        [7, 10, 14, 17],     // A7
      ],
      nostalgic_rnb: [
        [0, 4, 7, 11, 14],   // Bbmaj9
        [7, 11, 14, 17],     // F7
        [9, 12, 16, 19],     // Gm7
        [5, 9, 12, 16],      // Ebmaj7
      ],
      emotion_ballad: [
        [0, 3, 7, 10],       // F#m
        [7, 11, 14, 17],     // Dmaj7
        [2, 5, 9, 12],       // Bm7
        [8, 12, 15, 19],     // C#7
      ],
      acoustic: [
        [0, 4, 7, 11],       // Fmaj7
        [9, 12, 16],         // Dm
        [5, 9, 12],          // Bb
        [7, 11, 14],         // C
      ]
    };

    const chordsList = progressions[style] || progressions.soul_pop;

    // Melody scale intervals
    const melodyScale = [0, 2, 4, 7, 9, 11, 12, 14, 16];

    // Trigger full bar chords & atmospheric pad
    const playChordBar = () => {
      if (!this.ctx || !this.masterGain || !this.isPlaying || this.isUsingRealAudio) return;

      const now = this.ctx.currentTime;
      const currentChord = chordsList[barIndex % chordsList.length];
      barIndex++;

      // 1. Lush Electric Piano / Acoustic Pad Chords (Warm Polyphonic Voicing)
      currentChord.forEach((offset, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        const freq = midiToFreq(rootNote + offset);
        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400 + idx * 250, now);
        filter.Q.setValueAtTime(1.2, now);

        // Strum arpeggiation delay (15ms between strings)
        const noteStart = now + idx * 0.018;
        const noteDuration = (chordIntervalMs / 1000) * 0.95;

        noteGain.gain.setValueAtTime(0.0001, noteStart);
        noteGain.gain.setTargetAtTime(0.12 / (idx + 1.2), noteStart, 0.04);
        noteGain.gain.setTargetAtTime(0.0001, noteStart + noteDuration * 0.7, 0.2);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.masterGain);

        osc.start(noteStart);
        osc.stop(noteStart + noteDuration);

        this.activeVoices.push({ osc, gain: noteGain });
      });

      // 2. Warm Bassline
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const bassFreq = midiToFreq(rootNote - 12 + currentChord[0]);

      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(bassFreq, now);

      bassGain.gain.setValueAtTime(0.0001, now);
      bassGain.gain.setTargetAtTime(0.24, now, 0.03);
      bassGain.gain.setTargetAtTime(0.0001, now + (chordIntervalMs / 1000) * 0.8, 0.15);

      bassOsc.connect(bassGain);
      bassGain.connect(this.masterGain);

      bassOsc.start(now);
      bassOsc.stop(now + (chordIntervalMs / 1000) * 0.95);

      this.activeVoices.push({ osc: bassOsc, gain: bassGain });

      // Clean up finished voice references periodically
      if (this.activeVoices.length > 50) {
        this.activeVoices = this.activeVoices.slice(-20);
      }
    };

    // Trigger individual rhythmic beats and vocal/lead melody notes
    const playBeat = () => {
      if (!this.ctx || !this.masterGain || !this.isPlaying || this.isUsingRealAudio) return;

      const now = this.ctx.currentTime;
      const beatInBar = beatIndex % 4;
      beatIndex++;

      // 1. Kick Drum (Beat 0 and Beat 2.5)
      if (beatInBar === 0 || (beatInBar === 2 && trackNum % 2 === 0)) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(120, now);
        kickOsc.frequency.exponentialRampToValueAtTime(38, now + 0.08);

        kickGain.gain.setValueAtTime(0.3, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        kickOsc.connect(kickGain);
        kickGain.connect(this.masterGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.15);
      }

      // 2. Snare / Finger Snap (Beat 1 and Beat 3)
      if (beatInBar === 1 || beatInBar === 3) {
        const snapOsc = this.ctx.createOscillator();
        const snapGain = this.ctx.createGain();
        const snapFilter = this.ctx.createBiquadFilter();

        snapOsc.type = 'triangle';
        snapOsc.frequency.setValueAtTime(240, now);

        snapFilter.type = 'bandpass';
        snapFilter.frequency.setValueAtTime(1800, now);
        snapFilter.Q.setValueAtTime(3.0, now);

        snapGain.gain.setValueAtTime(0.15, now);
        snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

        snapOsc.connect(snapFilter);
        snapFilter.connect(snapGain);
        snapGain.connect(this.masterGain);
        snapOsc.start(now);
        snapOsc.stop(now + 0.1);
      }

      // 3. Crisp Hi-Hat / Acoustic Shaker
      const hatOsc = this.ctx.createOscillator();
      const hatGain = this.ctx.createGain();
      const hatFilter = this.ctx.createBiquadFilter();

      hatOsc.type = 'square';
      hatOsc.frequency.setValueAtTime(3800 + (beatInBar % 2) * 800, now);

      hatFilter.type = 'highpass';
      hatFilter.frequency.setValueAtTime(4500, now);

      hatGain.gain.setValueAtTime(0.035, now);
      hatGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      hatOsc.connect(hatFilter);
      hatFilter.connect(hatGain);
      hatGain.connect(this.masterGain);
      hatOsc.start(now);
      hatOsc.stop(now + 0.06);

      // 4. Soulful Lead Melody Note (Occurs rhythmically like a singing phrase)
      if (beatInBar === 0 || beatInBar === 2 || (beatInBar === 3 && Math.random() > 0.4)) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        const leadFilter = this.ctx.createBiquadFilter();

        const scaleStep = melodyScale[(beatIndex + trackNum) % melodyScale.length];
        const melodyFreq = midiToFreq(rootNote + 12 + scaleStep);

        leadOsc.type = 'sine';
        leadOsc.frequency.setValueAtTime(melodyFreq, now);

        leadFilter.type = 'lowpass';
        leadFilter.frequency.setValueAtTime(2200, now);
        leadFilter.Q.setValueAtTime(1.5, now);

        const leadDur = (beatIntervalMs / 1000) * 0.8;
        leadGain.gain.setValueAtTime(0.0001, now);
        leadGain.gain.setTargetAtTime(0.14, now, 0.03);
        leadGain.gain.setTargetAtTime(0.0001, now + leadDur * 0.6, 0.1);

        leadOsc.connect(leadFilter);
        leadFilter.connect(leadGain);
        leadGain.connect(this.masterGain);

        leadOsc.start(now);
        leadOsc.stop(now + leadDur);
      }
    };

    // Initial triggers
    playChordBar();
    playBeat();

    // Loop timers
    this.chordTimer = window.setInterval(playChordBar, chordIntervalMs);
    this.beatTimer = window.setInterval(playBeat, beatIntervalMs);
  }

  private stopAudioSynthesis() {
    if (this.chordTimer !== null) {
      clearInterval(this.chordTimer);
      this.chordTimer = null;
    }
    if (this.beatTimer !== null) {
      clearInterval(this.beatTimer);
      this.beatTimer = null;
    }

    // Stop and clear active oscillator voices
    for (const voice of this.activeVoices) {
      try {
        voice.gain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
        voice.osc.stop();
        voice.osc.disconnect();
      } catch {
        // Ignored
      }
    }
    this.activeVoices = [];
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

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }

      if (sum > 5) {
        const result: number[] = [];
        const step = Math.floor(bufferLength / 16) || 1;
        for (let i = 0; i < 16; i++) {
          const val = dataArray[i * step] || 0;
          result.push(Math.max(12, Math.min(100, Math.floor((val / 255) * 100))));
        }
        return result;
      }
    }

    // Dynamic rhythmic fallback visualizer for smooth real-time animation
    const t = Date.now() / 140;
    const result: number[] = [];
    for (let i = 0; i < 16; i++) {
      const wave1 = Math.sin(t + i * 0.4) * 28;
      const wave2 = Math.cos(t * 1.4 + i * 0.3) * 18;
      const beat = (Math.sin(t * 2) > 0.5 ? 30 : 0) * (i < 6 ? 1.4 : 0.6);
      const val = Math.max(15, Math.min(95, Math.floor(42 + wave1 + wave2 + beat)));
      result.push(val);
    }
    return result;
  }
}

export const audioSynth = new AudioSynthEngine();

