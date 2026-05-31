// ============================================================================
// SFX — tiny WebAudio synth. No external assets; every sound is generated.
// A single AudioContext, created/resumed on the first user gesture. Includes
// a low ambient neon-noir music bed routed through the master gain so it
// follows the mute setting. Every call is guarded so audio never throws.
// ============================================================================

type Wave = OscillatorType;

class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;
  private musicStarted = false;

  /** Create or resume the audio context. Call from a user gesture. */
  ensure(): void {
    if (typeof window === 'undefined') return;
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.5;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      this.startMusic();
    } catch {
      /* audio is optional */
    }
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.5, this.ctx.currentTime, 0.02);
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  private tone(freq: number, dur: number, type: Wave, gain: number, when = 0, slideTo?: number): void {
    if (!this.ctx || !this.master || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  private noise(dur: number, gain: number, when = 0, hp = 800): void {
    if (!this.ctx || !this.master || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const frames = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = hp;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t0);
  }

  /**
   * Ambient neon-noir pad: two detuned drones through a sweeping lowpass plus
   * a sparse arpeggio. Low level by design; auto-mutes via the master gain.
   */
  private startMusic(): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master || this.musicStarted) return;
    this.musicStarted = true;

    const bus = ctx.createGain();
    bus.gain.value = 0.14;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 480;
    filter.Q.value = 6;
    filter.connect(bus);
    bus.connect(master);

    [55, 82.4, 110].forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 2 ? 'triangle' : 'sawtooth';
      osc.frequency.value = f;
      osc.detune.value = (i - 1) * 6;
      const g = ctx.createGain();
      g.gain.value = i === 2 ? 0.18 : 0.3;
      osc.connect(g);
      g.connect(filter);
      osc.start();
    });

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const notes = [440, 523.25, 659.25, 783.99, 880];
    setInterval(() => {
      if (this.muted || !this.ctx || !this.master) return;
      const f = notes[Math.floor(Math.random() * notes.length)];
      const t0 = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6);
      o.connect(g);
      g.connect(filter);
      o.start(t0);
      o.stop(t0 + 1.7);
    }, 3800);
  }

  // ---- named sounds ------------------------------------------------------

  match(depth = 0): void {
    const base = 420 + depth * 90;
    this.tone(base, 0.12, 'triangle', 0.22, 0, base * 1.5);
  }
  cascade(depth: number): void {
    this.tone(500 + depth * 120, 0.14, 'square', 0.16, 0, 900 + depth * 160);
  }
  summon(): void {
    this.tone(180, 0.22, 'sawtooth', 0.18, 0, 520);
    this.noise(0.12, 0.05, 0, 1200);
  }
  hit(): void {
    this.noise(0.05, 0.05, 0, 1600);
  }
  enemyDeath(): void {
    this.tone(320, 0.14, 'triangle', 0.14, 0, 90);
  }
  coreHit(): void {
    this.tone(90, 0.26, 'sawtooth', 0.28, 0, 50);
    this.noise(0.16, 0.12, 0, 300);
  }
  overclock(): void {
    [0, 0.06, 0.12].forEach((d, i) => this.tone(330 * (i + 1), 0.4, 'square', 0.16, d, 660 * (i + 1)));
  }
  skill(): void {
    this.tone(700, 0.2, 'sawtooth', 0.18, 0, 240);
    this.noise(0.1, 0.06, 0, 2000);
  }
  win(): void {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.5, 'triangle', 0.2, i * 0.12));
  }
  lose(): void {
    [400, 320, 240, 160].forEach((f, i) => this.tone(f, 0.5, 'sawtooth', 0.18, i * 0.14));
  }
  reveal(rarity: string): void {
    const map: Record<string, number[]> = {
      R: [330],
      SR: [392, 523],
      SSR: [523, 659, 784],
      UR: [523, 659, 784, 1047, 1319],
    };
    const seq = map[rarity] ?? map.R;
    seq.forEach((f, i) => this.tone(f, 0.55, 'triangle', 0.22, i * 0.09, f * 1.01));
    if (rarity === 'UR' || rarity === 'SSR') this.noise(0.3, 0.06, 0, 2400);
  }
  ui(): void {
    this.tone(660, 0.05, 'square', 0.08);
  }
  levelup(): void {
    [660, 880].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.18, i * 0.08));
  }
  coin(): void {
    this.tone(988, 0.08, 'square', 0.16, 0);
    this.tone(1319, 0.14, 'square', 0.16, 0.07);
  }
}

export const sfx = new Sfx();
