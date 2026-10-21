import type { Settings } from "../game/persistence.ts";

export type SoundName =
  "key" | "bell" | "blocked" | "hint" | "move" | "failure" | "solve";

const FREQUENCIES: Record<SoundName, number> = {
  key: 420,
  bell: 150,
  blocked: 110,
  hint: 660,
  move: 240,
  failure: 90,
  solve: 880,
};

export class AudioController {
  private context: AudioContext | null = null;
  private ambience: OscillatorNode | null = null;

  constructor(private settings: Settings) {}

  update(settings: Settings): void {
    this.settings = settings;
    if (!settings.musicEnabled) this.stopMusic();
  }

  play(name: SoundName): void {
    if (!this.settings.soundEnabled) return;
    const context = this.ensureContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = name === "solve" ? "sine" : "square";
    oscillator.frequency.value = FREQUENCIES[name];
    gain.gain.setValueAtTime(
      this.settings.soundVolume * 0.05,
      context.currentTime,
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + (name === "solve" ? 0.35 : 0.07),
    );
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + (name === "solve" ? 0.35 : 0.08));
  }

  startMusic(chapterIndex: number): void {
    if (!this.settings.musicEnabled || this.ambience) return;
    const context = this.ensureContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 55 + chapterIndex * 7;
    gain.gain.value = this.settings.musicVolume * 0.025;
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    this.ambience = oscillator;
  }

  stopMusic(): void {
    this.ambience?.stop();
    this.ambience = null;
  }

  suspend(): void {
    void this.context?.suspend();
  }

  resume(): void {
    void this.context?.resume();
  }

  private ensureContext(): AudioContext {
    this.context ??= new AudioContext();
    return this.context;
  }
}
