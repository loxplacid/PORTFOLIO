"use client";

import dynamic from "next/dynamic";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { KineticText } from "@/components/motion/kinetic-text";
import { Reveal } from "@/components/motion/reveal";
import { MagneticLink } from "@/components/ui/magnetic-link";
import { StatusPill } from "@/components/ui/status-pill";
import { GlassChip } from "@/components/ui/glass-chip";
import { useFieldMode } from "@/lib/use-webgl-mode";
import { useMounted } from "@/lib/use-mounted";
import { useGpuTier } from "@/lib/use-gpu-tier";
import { scrollToTarget } from "@/components/layout/smooth-scroll";
import { useUIStore } from "@/store/ui-store";
import { FieldFallback } from "./field-fallback";

const HeroScene = dynamic(() => import("./hero-scene"), {
  ssr: false,
});

export function Hero() {
  const mode = useFieldMode();
  const mounted = useMounted();
  const detected = useGpuTier();
  const graphicsOverride = useUIStore((s) => s.graphicsOverride);
  const theme = useUIStore((s) => s.theme);
  const tier = graphicsOverride === "auto" ? detected : graphicsOverride;
  const fieldMode = mounted ? mode : "pending";
  const [fps, setFps] = useState<number | null>(null);
  const [vramMb, setVramMb] = useState<number | null>(null);
  const handleFps = useCallback((value: number) => setFps(value), []);
  const handleVram = useCallback((mb: number) => setVramMb(mb), []);
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex h-[100svh] flex-col overflow-hidden"
    >
      {theme === "dark" && fieldMode === "webgl" ? (        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        >
          <HeroScene active={inView} tier={tier} onFps={handleFps} onVram={handleVram} sectionIndex={0} />
        </motion.div>
      ) : (
        <FieldFallback />
      )}

      {theme === "dark" && fieldMode === "webgl" ? (        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[5] hidden lg:block"
        >
          <GlassChip className="left-[71%] top-[19%]" depth={16}>
            <p className="font-mono text-micro text-faint">
              GPU field — liquid metal
            </p>
            <p className="mt-1 font-mono text-micro text-accent">
              {fps ? `${String(fps).padStart(2, "0")} fps` : "calibrating"} ·{" "}
              {tier === "low" ? "eco mode" : "glsl fbm"}
              {vramMb !== null ? ` · ${vramMb}mb vram` : ""}
            </p>
          </GlassChip>
          <GlassChip className="left-[68%] top-[75%]" depth={24}>
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-2 rounded-full bg-accent animate-pulse-dot"
              />
              <span className="font-mono text-micro text-dim">
                env sync · live hue
              </span>
            </span>
          </GlassChip>
        </div>
      ) : null}

      <div className="shell relative z-10 flex flex-1 flex-col justify-between pt-28 sm:pt-32">
        <Reveal delay={0.05}>
          <div className="grid-bespoke items-center gap-y-3 border-b border-line pb-5">
            <p className="col-span-8 font-mono text-micro text-dim md:col-span-4">
              Folio — 2026
            </p>
            <p className="col-span-4 hidden font-mono text-micro text-faint md:col-span-4 md:block">
              Interface practice
            </p>
            <p className="col-span-4 hidden text-right font-mono text-micro text-faint md:col-span-4 md:block">
              [ 01 ]
            </p>
            <p className="col-span-4 text-right font-mono text-micro text-faint md:hidden">
              [ 01 ]
            </p>
          </div>
        </Reveal>

        <div className="py-16 sm:py-20">
          <Reveal delay={0.1} className="mb-9">
            <StatusPill />
          </Reveal>

          <h1 className="font-display font-semibold uppercase">
            <KineticText text="Design" className="block text-hero" />
            <KineticText text="Engineer" className="block text-hero text-hollow" />
          </h1>

          <Reveal delay={0.65} className="mt-10 max-w-xl">
            <p className="text-lede text-dim">
              Interfaces built where typography, motion and systems engineering
              meet — measured, deliberate, and fast.
            </p>
          </Reveal>

          <Reveal delay={0.75} className="mt-10">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <MagneticLink
                onClick={() => scrollToTarget("#work")}
                className="rounded-full bg-accent px-7 py-3.5 font-mono text-micro text-background transition-colors hover:bg-accent-deep"
              >
                View selected work
                <ArrowUpRight size={14} strokeWidth={2} />
              </MagneticLink>
              <MagneticLink
                onClick={() => scrollToTarget("#contact")}
                className="rounded-full border border-line bg-surface/70 px-7 py-3.5 font-mono text-micro text-dim backdrop-blur-sm transition-colors hover:border-accent-deep hover:text-accent"
              >
                Start a conversation
                <ArrowUpRight size={14} strokeWidth={2} />
              </MagneticLink>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.85}>
          <div className="flex items-center justify-between border-t border-line pt-5 pb-2">
            <p className="flex items-center gap-2.5 font-mono text-micro text-faint">
              Scroll to explore
              <span className="inline-flex animate-pulse-dot text-dim">
                <ArrowDown size={13} strokeWidth={1.5} aria-hidden />
              </span>
            </p>
            <p className="flex items-center gap-2 font-mono text-micro text-faint">
              <span
                className={`size-1.5 rounded-full ${
                  fieldMode === "webgl" ? "bg-accent" : "bg-faint"
                }`}
              />
              {fieldMode === "pending" ? "FIELD / INIT"
                : fieldMode === "webgl" ? "FIELD / WEBGL"
                  : "FIELD / STATIC"}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
