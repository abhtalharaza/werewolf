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
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

  // Realistic Cinematic Wolf Pack Howl (Authentic Vocal Formants, Natural Vibrato, Breath & Forest Echo)
  public playWolfHowl() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;
    const vol = this.volume;

    // Master Night Sound Bus
    const masterBus = ctx.createGain();
    masterBus.gain.setValueAtTime(vol, t);
    masterBus.connect(ctx.destination);

    // Forest Echo & Reverb Delay
    const echoDelay = ctx.createDelay();
    echoDelay.delayTime.setValueAtTime(0.24, t);
    const echoFeedback = ctx.createGain();
    echoFeedback.gain.setValueAtTime(0.35, t);
    const echoDamp = ctx.createBiquadFilter();
    echoDamp.type = 'lowpass';
    echoDamp.frequency.setValueAtTime(950, t);

    echoDelay.connect(echoDamp);
    echoDamp.connect(echoFeedback);
    echoFeedback.connect(echoDelay);
    echoDamp.connect(masterBus);

    // 1. Deep Night Sub-Bass Suspense Swell (Ominous Dread)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(55, t);
    subOsc.frequency.exponentialRampToValueAtTime(45, t + 4.0);

    subGain.gain.setValueAtTime(0, t);
    subGain.gain.linearRampToValueAtTime(0.25, t + 0.6);
    subGain.gain.setValueAtTime(0.25, t + 2.0);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 4.2);

    subOsc.connect(subGain);
    subGain.connect(masterBus);
    subOsc.start(t);
    subOsc.stop(t + 4.3);

    // 2. Low Throat Snarl / Primal Growl (t = 0 to 0.8s)
    const growlOsc = ctx.createOscillator();
    const growlMod = ctx.createOscillator();
    const growlModGain = ctx.createGain();
    const growlGain = ctx.createGain();
    const growlFilter = ctx.createBiquadFilter();

    growlOsc.type = 'sawtooth';
    growlOsc.frequency.setValueAtTime(75, t);
    growlOsc.frequency.exponentialRampToValueAtTime(110, t + 0.6);

    // AM modulation creates guttural throat rattle
    growlMod.type = 'sine';
    growlMod.frequency.setValueAtTime(40, t);
    growlModGain.gain.setValueAtTime(30, t);
    growlMod.connect(growlModGain);
    growlModGain.connect(growlOsc.frequency);

    growlFilter.type = 'lowpass';
    growlFilter.frequency.setValueAtTime(350, t);
    growlFilter.Q.setValueAtTime(3, t);

    growlGain.gain.setValueAtTime(0, t);
    growlGain.gain.linearRampToValueAtTime(0.22, t + 0.15);
    growlGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

    growlOsc.connect(growlFilter);
    growlFilter.connect(growlGain);
    growlGain.connect(masterBus);

    growlOsc.start(t);
    growlMod.start(t);
    growlOsc.stop(t + 0.95);
    growlMod.stop(t + 0.95);

    // 3. Alpha Werewolf Vocal Howl (Multi-Oscillator with Vocal Formants & Natural Vibrato)
    const voiceOsc1 = ctx.createOscillator();
    const voiceOsc2 = ctx.createOscillator();
    const vocalMix = ctx.createGain();
    const voiceGain = ctx.createGain();

    voiceOsc1.type = 'triangle'; // Warm chest tone
    voiceOsc2.type = 'sawtooth'; // Vocal cord harmonics

    // Pitch Curve: Deep rise -> piercing mournful howl -> sustained vibrato -> downward melancholic descent
    const setHowlPitch = (osc: OscillatorNode, baseOffset: number = 0) => {
      osc.frequency.setValueAtTime(190 + baseOffset, t);
      // Throat rise into the night sky
      osc.frequency.exponentialRampToValueAtTime(320 + baseOffset, t + 0.35);
      osc.frequency.exponentialRampToValueAtTime(485 + baseOffset, t + 0.85);
      // Sustained peak cry
      osc.frequency.linearRampToValueAtTime(510 + baseOffset, t + 1.8);
      osc.frequency.linearRampToValueAtTime(475 + baseOffset, t + 2.7);
      // Melancholic descent into darkness
      osc.frequency.exponentialRampToValueAtTime(330 + baseOffset, t + 3.8);
      osc.frequency.exponentialRampToValueAtTime(210 + baseOffset, t + 4.8);
    };

    setHowlPitch(voiceOsc1, 0);
    setHowlPitch(voiceOsc2, 2.5); // Slight detune for thick chorus

    // Natural Animal Vibrato (LFO)
    const vibratoLFO = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibratoLFO.type = 'sine';
    vibratoLFO.frequency.setValueAtTime(5.3, t); // 5.3 Hz natural wolf vibrato rate

    vibratoGain.gain.setValueAtTime(0, t);
    vibratoGain.gain.linearRampToValueAtTime(4, t + 0.8);
    vibratoGain.gain.linearRampToValueAtTime(15, t + 1.5); // Rich wavering cry
    vibratoGain.gain.setValueAtTime(14, t + 2.6);
    vibratoGain.gain.exponentialRampToValueAtTime(2, t + 4.4);

    vibratoLFO.connect(vibratoGain);
    vibratoGain.connect(voiceOsc1.frequency);
    vibratoGain.connect(voiceOsc2.frequency);

    // Vocal Tract Formant Filters ("Awoo-ooo-uuu" mouth opening and closing)
    const formant1 = ctx.createBiquadFilter();
    formant1.type = 'bandpass';
    formant1.Q.setValueAtTime(4.2, t);
    formant1.frequency.setValueAtTime(580, t);
    formant1.frequency.linearRampToValueAtTime(750, t + 0.8); // "Aww"
    formant1.frequency.linearRampToValueAtTime(460, t + 2.4); // "Oooo"
    formant1.frequency.exponentialRampToValueAtTime(320, t + 4.6); // "Uuu"

    const formant2 = ctx.createBiquadFilter();
    formant2.type = 'bandpass';
    formant2.Q.setValueAtTime(3.8, t);
    formant2.frequency.setValueAtTime(1150, t);
    formant2.frequency.linearRampToValueAtTime(1380, t + 0.8);
    formant2.frequency.linearRampToValueAtTime(880, t + 2.5);
    formant2.frequency.exponentialRampToValueAtTime(620, t + 4.6);

    const mainFilter = ctx.createBiquadFilter();
    mainFilter.type = 'lowpass';
    mainFilter.frequency.setValueAtTime(1800, t);
    mainFilter.frequency.linearRampToValueAtTime(2400, t + 1.0);
    mainFilter.frequency.exponentialRampToValueAtTime(800, t + 4.5);

    // Voice Volume Envelope
    voiceGain.gain.setValueAtTime(0, t);
    voiceGain.gain.linearRampToValueAtTime(0.38, t + 0.7);
    voiceGain.gain.setValueAtTime(0.38, t + 2.4);
    voiceGain.gain.linearRampToValueAtTime(0.24, t + 3.6);
    voiceGain.gain.exponentialRampToValueAtTime(0.001, t + 5.0);

    // Connect voice chain
    voiceOsc1.connect(vocalMix);
    voiceOsc2.connect(vocalMix);

    vocalMix.connect(formant1);
    vocalMix.connect(formant2);

    formant1.connect(mainFilter);
    formant2.connect(mainFilter);
    mainFilter.connect(voiceGain);

    voiceGain.connect(masterBus);
    voiceGain.connect(echoDelay); // Send to forest echo

    voiceOsc1.start(t);
    voiceOsc2.start(t);
    vibratoLFO.start(t);
    voiceOsc1.stop(t + 5.1);
    voiceOsc2.stop(t + 5.1);
    vibratoLFO.stop(t + 5.1);

    // 4. Exhaled Breath & Cold Night Wind Noise Layer
    try {
      const bufferSize = ctx.sampleRate * 4.5;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const breathFilter = ctx.createBiquadFilter();
      breathFilter.type = 'bandpass';
      breathFilter.Q.setValueAtTime(3.2, t);
      breathFilter.frequency.setValueAtTime(600, t);
      breathFilter.frequency.linearRampToValueAtTime(950, t + 1.2);
      breathFilter.frequency.exponentialRampToValueAtTime(450, t + 4.2);

      const breathGain = ctx.createGain();
      breathGain.gain.setValueAtTime(0, t);
      breathGain.gain.linearRampToValueAtTime(0.12, t + 0.8);
      breathGain.gain.setValueAtTime(0.10, t + 2.5);
      breathGain.gain.exponentialRampToValueAtTime(0.001, t + 4.6);

      whiteNoise.connect(breathFilter);
      breathFilter.connect(breathGain);
      breathGain.connect(masterBus);

      whiteNoise.start(t);
      whiteNoise.stop(t + 4.7);
    } catch {
      // ignore buffer fallback
    }

    // 5. Secondary Pack Wolf (Distant Wolf Answering the Call in the Night Woods)
    const t2 = t + 0.85;
    const wolf2Osc = ctx.createOscillator();
    const wolf2Gain = ctx.createGain();
    const wolf2Filter = ctx.createBiquadFilter();
    const wolf2Vibrato = ctx.createOscillator();
    const wolf2VibratoGain = ctx.createGain();

    wolf2Osc.type = 'triangle';
    wolf2Osc.frequency.setValueAtTime(175, t2);
    wolf2Osc.frequency.exponentialRampToValueAtTime(380, t2 + 0.7);
    wolf2Osc.frequency.linearRampToValueAtTime(410, t2 + 1.8);
    wolf2Osc.frequency.exponentialRampToValueAtTime(230, t2 + 4.2);

    wolf2Vibrato.type = 'sine';
    wolf2Vibrato.frequency.setValueAtTime(4.8, t2);
    wolf2VibratoGain.gain.setValueAtTime(0, t2);
    wolf2VibratoGain.gain.linearRampToValueAtTime(11, t2 + 1.2);
    wolf2VibratoGain.gain.exponentialRampToValueAtTime(1, t2 + 4.0);

    wolf2Vibrato.connect(wolf2VibratoGain);
    wolf2VibratoGain.connect(wolf2Osc.frequency);

    wolf2Filter.type = 'lowpass';
    wolf2Filter.frequency.setValueAtTime(750, t2); // Darker tone = distance

    wolf2Gain.gain.setValueAtTime(0, t2);
    wolf2Gain.gain.linearRampToValueAtTime(0.18, t2 + 0.6);
    wolf2Gain.gain.setValueAtTime(0.16, t2 + 2.2);
    wolf2Gain.gain.exponentialRampToValueAtTime(0.001, t2 + 4.4);

    wolf2Osc.connect(wolf2Filter);
    wolf2Filter.connect(wolf2Gain);
    wolf2Gain.connect(masterBus);
    wolf2Gain.connect(echoDelay);

    wolf2Osc.start(t2);
    wolf2Vibrato.start(t2);
    wolf2Osc.stop(t2 + 4.5);
    wolf2Vibrato.stop(t2 + 4.5);
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
