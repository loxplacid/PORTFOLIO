"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { audio } from "@/lib/audio-engine";
import { useUIStore } from "@/store/ui-store";

const BARS = "▁▂▃▄▅▆▇█";
const BAR_COUNT = 12;

export function SoundToggle() {
  const soundEnabled = useUIStore((s) => s.soundEnabled);
  const toggleSound = useUIStore((s) => s.toggleSound);
  const initSound = useUIStore((s) => s.initSound);
  const [wave, setWave] = useState("");

  useEffect(() => {
    initSound();
  }, [initSound]);

  useEffect(() => {
    audio.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    if (!soundEnabled) {
      const frame = requestAnimationFrame(() => setWave(""));
      return () => cancelAnimationFrame(frame);
    }
    const id = window.setInterval(() => {
      const peaks = audio.sampleWaveform(BAR_COUNT);
      setWave(
        peaks
          .map((p) => BARS[Math.min(BARS.length - 1, Math.floor(p * BARS.length))])
          .join(""),
      );
    }, 90);
    return () => {
      window.clearInterval(id);
      setWave("");
    };
  }, [soundEnabled]);

  return (
    <button
      type="button"
      data-no-drag
      onClick={toggleSound}
      aria-pressed={soundEnabled}
      title={soundEnabled ? "Sound on" : "Sound off"}
      aria-label={
        soundEnabled ? "Mute interface sounds" : "Enable interface sounds"
      }
      className={`flex h-9 items-center gap-2 rounded-full border px-3 transition-colors ${
        soundEnabled
          ? "border-accent text-accent"
          : "border-line bg-surface text-faint hover:border-line-hover hover:text-dim"
      }`}
    >
      {soundEnabled ? (
        <>
          <span className="w-[6.5ch] overflow-hidden text-left font-mono text-[9px] leading-none tracking-tight">
            {wave || BARS[0].repeat(BAR_COUNT)}
          </span>
          <Volume2 size={14} strokeWidth={1.75} />
        </>
      ) : (
        <>
          <VolumeX size={14} strokeWidth={1.75} />
          <span className="hidden font-mono text-micro text-faint md:inline">
            Off
          </span>
        </>
      )}
    </button>
  );
}
