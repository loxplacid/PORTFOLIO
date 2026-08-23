"use client";

type WithWebkit = typeof window & {
  webkitAudioContext?: typeof AudioContext;
};

interface ToneOptions {
  freq: number;
  endFreq?: number;
  type: OscillatorType;
  dur: number;
  gain: number;
  pan: number;
  delay?: number;
  lowpass?: number;
}

class SpatialAudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private waveData: Uint8Array<ArrayBuffer> | null = null;
  private enabled = false;
  private lastClickAt = 0;

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
    if (!value) {
      if (this.context && this.context.state === "running") {
        void this.context.suspend();
      }
      return;
    }
    const ctx = this.ensure();
    if (ctx) {
      void ctx.resume();
      this.tone({
        freq: 1200,
        endFreq: 800,
        type: "sine",
        dur: 0.012,
        gain: 0.04,
        pan: 0,
      });
    }
  }

  getAnalyser(): AnalyserNode | null {
    this.ensure();
    return this.enabled ? this.analyser : null;
  }

  sampleWaveform(buckets: number): number[] {
    if (!this.analyser || !this.waveData || !this.enabled) {
      return new Array<number>(buckets).fill(0);
    }
    this.analyser.getByteTimeDomainData(this.waveData);
    const output: number[] = [];
    const size = Math.floor(this.waveData.length / buckets) || 1;
    for (let b = 0; b < buckets; b++) {
      let peak = 0;
      const start = b * size;
      const end = Math.min(start + size, this.waveData.length);
      for (let i = start; i < end; i++) {
        const v = Math.abs(this.waveData[i] - 128) / 128;
        if (v > peak) peak = v;
      }
      output.push(peak);
    }
    return output;
  }

  private ensure(): AudioContext | null {
    if (!this.enabled || typeof window === "undefined") return null;
    if (!this.context) {
      const Ctor =
        window.AudioContext ?? (window as WithWebkit).webkitAudioContext;
      if (!Ctor) return null;
      this.context = new Ctor();
      const compressor = this.context.createDynamicsCompressor();
      this.master = this.context.createGain();
      this.master.gain.value = 0.14;
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.55;
      this.waveData = new Uint8Array(
        new ArrayBuffer(this.analyser.fftSize),
      );
      this.master.connect(this.analyser);
      this.analyser.connect(compressor);
      compressor.connect(this.context.destination);
    }
    return this.context;
  }

  private panFor(el?: HTMLElement | null): number {
    if (!el || typeof window === "undefined" || !el.getBoundingClientRect) {
      return 0;
    }
    const rect = el.getBoundingClientRect();
    if (!rect.width && !rect.height) return 0;
    return Math.max(
      -0.8,
      Math.min(0.8, ((rect.left + rect.width / 2) / window.innerWidth) * 2 - 1),
    );
  }

  private tone(options: ToneOptions): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime + (options.delay ?? 0);
    const osc = ctx.createOscillator();
    osc.type = options.type;
    osc.frequency.setValueAtTime(options.freq, t0);
    if (options.endFreq) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(30, options.endFreq),
        t0 + options.dur,
      );
    }
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(options.gain, t0 + options.dur * 0.25);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + options.dur);
    const panner = ctx.createStereoPanner();
    panner.pan.value = options.pan;
    osc.connect(gain);
    if (options.lowpass) {
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = options.lowpass;
      filter.Q.value = 0.7;
      gain.connect(filter);
      filter.connect(panner);
    } else {
      gain.connect(panner);
    }
    panner.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + options.dur + 0.03);
  }

  click(el?: HTMLElement | null): void {
    if (!this.enabled) return;
    const now = performance.now();
    if (now - this.lastClickAt < 45) return;
    this.lastClickAt = now;
    this.tone({
      freq: 1400,
      endFreq: 800,
      type: "sine",
      dur: 0.008,
      gain: 0.055,
      pan: this.panFor(el),
    });
  }

  snap(): void {
    if (!this.enabled) return;
    this.tone({
      freq: 50,
      endFreq: 40,
      type: "sine",
      dur: 0.08,
      gain: 0.17,
      pan: 0,
      lowpass: 200,
    });
  }

  sectionCue(): void {
    if (!this.enabled) return;
    this.tone({
      freq: 320,
      endFreq: 240,
      type: "sine",
      dur: 0.02,
      gain: 0.035,
      pan: 0,
    });
  }

  hum(distancePx: number, dirX: number): void {
    if (!this.enabled) return;
    const dur = Math.min(1.35, 0.42 + distancePx / 2600);
    const pan = Math.max(-0.7, Math.min(0.7, dirX));
    this.tone({ freq: 98, endFreq: 56, type: "triangle", dur, gain: 0.055, pan });
    this.tone({
      freq: 196,
      endFreq: 114,
      type: "sine",
      dur: dur * 0.85,
      gain: 0.02,
      pan: -pan * 0.5,
      delay: 0.02,
    });
  }
}

export const audio = new SpatialAudioEngine();

export function bindSoundDelegation(): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onOver = (event: Event) => {
    const target = event.target as HTMLElement | null;
    const el = target?.closest?.(
      "button, a, [data-sound]",
    ) as HTMLElement | null;
    if (el) audio.click(el);
  };
  window.addEventListener("pointerover", onOver, { passive: true });
  return () => window.removeEventListener("pointerover", onOver);
}
