import { WOLF_HOWL_BASE64 } from './wolfAudioData.js';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.5;
  private ambientGain: GainNode | null = null;
  private ambientSource: OscillatorNode | null = null;
  private wolfBuffer: AudioBuffer | null = null;
  private isWolfLoading: boolean = false;
  private wolfAudio: HTMLAudioElement | null = null;

  constructor() {
    // Load preference from localStorage if available
    try {
      const savedMute = localStorage.getItem('werewolf_muted');
      if (savedMute !== null) this.isMuted = savedMute === 'true';
      const savedVol = localStorage.getItem('werewolf_vol');
      if (savedVol !== null) this.volume = parseFloat(savedVol);
    } catch {
      // ignore
    }

    // Preload actual wolf howl audio element
    if (typeof window !== 'undefined') {
      try {
        this.wolfAudio = new Audio(WOLF_HOWL_BASE64);
        this.wolfAudio.preload = 'auto';
      } catch {
        // ignore
      }
    }
  }

  public async preloadWolfBuffer() {
    if (this.wolfBuffer || this.isWolfLoading) return;
    this.isWolfLoading = true;
    try {
      this.init();
      if (!this.ctx) return;
      const resp = await fetch(WOLF_HOWL_BASE64);
      const arrayBuf = await resp.arrayBuffer();
      this.wolfBuffer = await this.ctx.decodeAudioData(arrayBuf);
    } catch {
      // ignore, fallback will be used
    } finally {
      this.isWolfLoading = false;
    }
  }

  public init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.wolfBuffer && !this.isWolfLoading) {
      this.preloadWolfBuffer().catch(() => {});
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  public getVolume() {
    return this.volume;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('werewolf_muted', String(muted));
    } catch {
      // ignore
    }
    if (this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.05 * this.volume, this.ctx?.currentTime || 0);
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('werewolf_vol', String(this.volume));
    } catch {
      // ignore
    }
    if (this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.05 * this.volume, this.ctx?.currentTime || 0);
    }
  }

  // Authentic Wild Wolf Howl (~2.4s, actual recorded wolf vocalization)
  public playWolfHowl() {
    if (this.isMuted) return;
    this.init();

    // 1. Primary: Use pre-decoded Web Audio API buffer of actual wolf howl
    if (this.wolfBuffer && this.ctx) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = this.wolfBuffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.95 * this.volume, this.ctx.currentTime);
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start();
        return;
      } catch {
        // fallback to HTMLAudio
      }
    }

    // 2. Immediate HTML5 Audio element fallback using authentic wolf howl audio
    try {
      if (typeof window !== 'undefined') {
        if (!this.wolfAudio) {
          this.wolfAudio = new Audio(WOLF_HOWL_BASE64);
        }
        this.wolfAudio.volume = Math.max(0, Math.min(1, 0.95 * this.volume));
        this.wolfAudio.currentTime = 0;
        const playPromise = this.wolfAudio.play();
        if (playPromise) {
          playPromise.catch(() => {
            this.playSynthesizedWolfHowl();
          });
        }
        // Decode in background for subsequent calls
        if (!this.wolfBuffer) {
          this.preloadWolfBuffer().catch(() => {});
        }
        return;
      }
    } catch {
      // fallback to synth
    }

    // 3. Fallback: Concise ~2.2s synthesized wolf howl
    this.playSynthesizedWolfHowl();
  }

  // Heavy, deep & loud 2.5s synthesized wolf howl fallback
  public playSynthesizedWolfHowl() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;
    const vol = this.volume;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(vol * 0.9, t);
    masterGain.connect(ctx.destination);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const voiceGain = ctx.createGain();
    const subGain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    subOsc.type = 'sine'; // Deep chest vibration

    // Heavy low pitch contour: 140Hz throat growl -> 380Hz deep roar -> 240Hz finish
    const setPitch = (osc: OscillatorNode, detune: number) => {
      osc.frequency.setValueAtTime(140 + detune, t);
      osc.frequency.exponentialRampToValueAtTime(380 + detune, t + 0.5);
      osc.frequency.linearRampToValueAtTime(395 + detune, t + 1.2);
      osc.frequency.exponentialRampToValueAtTime(240 + detune, t + 2.1);
      osc.frequency.exponentialRampToValueAtTime(130 + detune, t + 2.5);
    };

    setPitch(osc1, 0);
    setPitch(osc2, 3);
    setPitch(subOsc, -60); // Heavy sub bass

    // Natural 4.8 Hz heavy animal vibrato
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(4.8, t);
    lfoGain.gain.setValueAtTime(0, t);
    lfoGain.gain.linearRampToValueAtTime(14, t + 0.6);
    lfoGain.gain.exponentialRampToValueAtTime(2, t + 2.2);
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    // Resonant low-mid formant filter for deep guttural roar/howl
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(3.5, t);
    filter.frequency.setValueAtTime(420, t);
    filter.frequency.linearRampToValueAtTime(750, t + 0.6);
    filter.frequency.exponentialRampToValueAtTime(300, t + 2.3);

    // Loud volume envelope
    voiceGain.gain.setValueAtTime(0.001, t);
    voiceGain.gain.linearRampToValueAtTime(0.65, t + 0.25);
    voiceGain.gain.setValueAtTime(0.65, t + 1.3);
    voiceGain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);

    subGain.gain.setValueAtTime(0.001, t);
    subGain.gain.linearRampToValueAtTime(0.35, t + 0.3);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 2.3);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(masterGain);

    subOsc.connect(subGain);
    subGain.connect(masterGain);

    osc1.start(t);
    osc2.start(t);
    subOsc.start(t);
    lfo.start(t);

    osc1.stop(t + 2.55);
    osc2.stop(t + 2.55);
    subOsc.stop(t + 2.55);
    lfo.stop(t + 2.55);
  }

  // Church Bell / Daybreak Gong
  public playBellToll() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const freqs = [220, 440, 587, 880];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime((0.2 / (idx + 1)) * this.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 2.6);
    });
  }

  // Voting Gavel / Stone Thud
  public playVoteCast() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);

    gain.gain.setValueAtTime(0.4 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  // Elimination Dramatic Strike
  public playElimination() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const noise = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 1.2);

    noise.type = 'square';
    noise.frequency.setValueAtTime(75, t);
    noise.frequency.exponentialRampToValueAtTime(25, t + 0.8);

    gain.gain.setValueAtTime(0.5 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

    osc.connect(gain);
    noise.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    noise.start(t);
    osc.stop(t + 1.4);
    noise.stop(t + 1.4);
  }

  // Mystic Role Reveal Shimmer
  public playMysticReveal() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [329.63, 440, 554.37, 659.25, 880]; // E minor / mystic chord arpeggio
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0, t + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2 * this.volume, t + idx * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 1.8);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 1.9);
    });
  }

  // Victory Fanfare
  public playVictory() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const chords = [
      { f: [261.63, 329.63, 392.0], delay: 0 },
      { f: [293.66, 369.99, 440.0], delay: 0.25 },
      { f: [349.23, 440.0, 523.25], delay: 0.5 },
      { f: [392.0, 493.88, 587.33, 783.99], delay: 0.8 },
    ];

    chords.forEach((chord) => {
      chord.f.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + chord.delay);

        gain.gain.setValueAtTime(0, t + chord.delay);
        gain.gain.linearRampToValueAtTime(0.18 * this.volume, t + chord.delay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + chord.delay + 1.4);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(t + chord.delay);
        osc.stop(t + chord.delay + 1.5);
      });
    });
  }

  // Chat message ping
  public playChatPing() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.08);

    gain.gain.setValueAtTime(0.12 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  // Suspenseful Clock Tick-Tick for remaining 5 seconds
  public playTick(isUrgent: boolean = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isUrgent ? 950 : 700, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.04);

    gain.gain.setValueAtTime(0.3 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }
}

export const sounds = new SoundEngine();

// Auto-unlock AudioContext on first user interaction so night wolf howl and game sound effects play cleanly
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    sounds.init();
  };
  ['click', 'touchstart', 'keydown', 'mousedown'].forEach((evt) => {
    window.addEventListener(evt, unlockAudio, { once: true, passive: true });
  });
}
