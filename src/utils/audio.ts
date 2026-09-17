class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.5;
  private ambientGain: GainNode | null = null;
  private ambientSource: OscillatorNode | null = null;

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
  }

  public init() {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
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

  // Crisp, powerful short Alpha Wolf call (~1.4s duration, rich chest resonance, natural breath & quick echo)
  public playWolfHowl() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;
    const vol = this.volume;

    // Master bus (direct sound, zero echo)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(vol * 0.9, t);
    masterGain.connect(ctx.destination);

    // --- 1. NATURAL CHEST & THROAT VOCAL CORDS ---
    // Primary warm canine core (Triangle for thick warm body)
    const oscBody = ctx.createOscillator();
    oscBody.type = 'triangle';

    // Vocal cord texture (Warm Sawtooth for harmonic presence)
    const oscGrit = ctx.createOscillator();
    oscGrit.type = 'sawtooth';

    // Sub-bass chest foundation (Sine for solid, non-shrill weight)
    const oscSub = ctx.createOscillator();
    oscSub.type = 'sine';

    // Concise, confident pitch curve (~1.3s total active vocal):
    // Powerful chest launch (210Hz) -> swift confident rise to Alpha howl (355Hz) in 0.28s -> steady roar -> clean, smooth fade (290Hz)
    const setShortHowlPitch = (osc: OscillatorNode, offset: number) => {
      osc.frequency.setValueAtTime(210 + offset, t);
      osc.frequency.exponentialRampToValueAtTime(355 + offset, t + 0.28);
      osc.frequency.linearRampToValueAtTime(365 + offset, t + 0.75);
      osc.frequency.exponentialRampToValueAtTime(290 + offset, t + 1.25);
    };

    setShortHowlPitch(oscBody, 0);
    setShortHowlPitch(oscGrit, 2);

    // Sub oscillator stays deep in the chest
    oscSub.frequency.setValueAtTime(105, t);
    oscSub.frequency.exponentialRampToValueAtTime(178, t + 0.28);
    oscSub.frequency.linearRampToValueAtTime(182, t + 0.75);
    oscSub.frequency.exponentialRampToValueAtTime(145, t + 1.25);

    // Fast, subtle animal throat tremor (natural canine vocal tension)
    const tremor = ctx.createOscillator();
    const tremorGain = ctx.createGain();
    tremor.type = 'sine';
    tremor.frequency.setValueAtTime(5.2, t);
    tremorGain.gain.setValueAtTime(0, t);
    tremorGain.gain.linearRampToValueAtTime(3.5, t + 0.3);
    tremorGain.gain.exponentialRampToValueAtTime(1.0, t + 1.1);
    tremor.connect(tremorGain);
    tremorGain.connect(oscBody.frequency);
    tremorGain.connect(oscGrit.frequency);

    // --- 2. DUAL CANINE FORMANT FILTERS (Removes synthetic tone, creates real animal vocal tract) ---
    // Throat formant: amplifies natural chest fullness at 460Hz
    const throatFormant = ctx.createBiquadFilter();
    throatFormant.type = 'peaking';
    throatFormant.frequency.setValueAtTime(460, t);
    throatFormant.Q.setValueAtTime(2.0, t);
    throatFormant.gain.setValueAtTime(6.0, t);

    // Muzzle formant: shapes natural "Auuu" sound without harshness
    const mouthFormant = ctx.createBiquadFilter();
    mouthFormant.type = 'lowpass';
    mouthFormant.frequency.setValueAtTime(750, t);
    mouthFormant.frequency.linearRampToValueAtTime(1300, t + 0.28);
    mouthFormant.frequency.exponentialRampToValueAtTime(700, t + 1.25);
    mouthFormant.Q.setValueAtTime(2.2, t);

    // Smooth warmth filter: cuts all ear-piercing frequencies
    const warmthFilter = ctx.createBiquadFilter();
    warmthFilter.type = 'lowpass';
    warmthFilter.frequency.setValueAtTime(1900, t);

    // Amplitude envelope: fast punchy start, solid 0.7s body, clean natural decay by 1.35s
    const voiceGain = ctx.createGain();
    voiceGain.gain.setValueAtTime(0.001, t);
    voiceGain.gain.linearRampToValueAtTime(0.7, t + 0.15); // Quick authoritative attack
    voiceGain.gain.setValueAtTime(0.65, t + 0.75); // Strong sustained crest
    voiceGain.gain.exponentialRampToValueAtTime(0.001, t + 1.35); // Clean decay

    // Sub gain
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.001, t);
    subGain.gain.linearRampToValueAtTime(0.35, t + 0.18);
    subGain.gain.setValueAtTime(0.32, t + 0.7);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.3);

    // Mix vocal oscillators
    const mix = ctx.createGain();
    mix.gain.setValueAtTime(0.55, t);
    oscBody.connect(mix);
    oscGrit.connect(mix);

    mix.connect(throatFormant);
    throatFormant.connect(mouthFormant);
    mouthFormant.connect(warmthFilter);
    warmthFilter.connect(voiceGain);

    oscSub.connect(subGain);
    subGain.connect(masterGain);

    // Direct output to master, zero echo
    voiceGain.connect(masterGain);

    // --- 3. SUBTLE INITIAL BREATH ATTACK (Lungs expelling cold air) ---
    try {
      const sampleRate = ctx.sampleRate;
      const breathSamples = Math.floor(sampleRate * 0.4);
      const breathBuffer = ctx.createBuffer(1, breathSamples, sampleRate);
      const breathData = breathBuffer.getChannelData(0);
      for (let i = 0; i < breathSamples; i++) {
        breathData[i] = (Math.random() * 2 - 1) * 0.2;
      }
      const breathSrc = ctx.createBufferSource();
      breathSrc.buffer = breathBuffer;

      const breathFilter = ctx.createBiquadFilter();
      breathFilter.type = 'bandpass';
      breathFilter.frequency.setValueAtTime(550, t);
      breathFilter.Q.setValueAtTime(2.0, t);

      const breathGain = ctx.createGain();
      breathGain.gain.setValueAtTime(0.001, t);
      breathGain.gain.linearRampToValueAtTime(0.12, t + 0.08);
      breathGain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

      breathSrc.connect(breathFilter);
      breathFilter.connect(breathGain);
      breathGain.connect(masterGain);

      breathSrc.start(t);
      breathSrc.stop(t + 0.4);
    } catch {
      // ignore
    }

    // Start & stop active audio nodes (short 1.4s overall runtime)
    oscBody.start(t);
    oscGrit.start(t);
    oscSub.start(t);
    tremor.start(t);

    const stopTime = t + 1.4;
    oscBody.stop(stopTime);
    oscGrit.stop(stopTime);
    oscSub.stop(stopTime);
    tremor.stop(stopTime);
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
