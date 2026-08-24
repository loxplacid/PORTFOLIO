"use client";

import dynamic from "next/dynamic";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { KineticText } from "@/components/motion/kinetic-text";
import { Reveal } from "@/components/motion/reveal";
import { MagneticLink } from "@/components/ui/magnetic-link";
import { StatusPill } from "@/components/ui/status-pill";
import { useFieldMode } from "@/lib/use-webgl-mode";
import { useMounted } from "@/lib/use-mounted";
import { useGpuTier } from "@/lib/use-gpu-tier";
import { scrollToTarget } from "@/components/layout/smooth-scroll";
import { useUIStore } from "@/store/ui-store";
import { IDENTITY_DISPLAY } from "@/data/site";
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
  const handleFps = useCallback((value: number) => setFps(value), []);
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
      className="relative isolate flex h-full flex-col overflow-hidden"
    >
      {theme === "dark" && fieldMode === "webgl" ? (
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        >
          <HeroScene active={inView} tier={tier} onFps={handleFps} />
        </motion.div>
      ) : (
        <FieldFallback />
      )}

      {theme === "dark" && fieldMode === "webgl" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[5] hidden lg:block"
        >
          <div className="absolute left-[71%] top-[19%] border-l border-line pl-4">
            <p className="font-mono text-micro text-faint">
              GPU field — liquid metal
            </p>
            <p className="mt-1 font-mono text-micro text-accent">
              {fps ? `${String(fps).padStart(2, "0")} fps` : "calibrating"} ·{" "}
              {tier === "low" ? "eco mode" : "glsl"}
            </p>
          </div>
        </div>
      ) : null}

      <div className="shell relative z-10 flex flex-1 flex-col justify-between pt-28 sm:pt-32">
        <Reveal delay={0.05}>
          <div className="grid-bespoke items-center gap-y-3 border-b border-line pb-5">
            <p className="col-span-8 font-mono text-micro text-dim md:col-span-4">
              {IDENTITY_DISPLAY.name} — {new Date().getFullYear()}
            </p>
            <p className="col-span-4 hidden font-mono text-micro text-faint md:col-span-4 md:block">
              {IDENTITY_DISPLAY.role}
              {IDENTITY_DISPLAY.pronouns
                ? ` · ${IDENTITY_DISPLAY.pronouns}`
                : ""}
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
            {splitRole(IDENTITY_DISPLAY.role).map((line, i) => (
              <KineticText
                key={i}
                text={line}
                className={`block text-hero${i % 2 === 1 ? " text-hollow" : ""}`}
              />
            ))}
          </h1>

          <Reveal delay={0.65} className="mt-10 max-w-xl">
            <p className="text-lede text-dim">
              {IDENTITY_DISPLAY.positioningShort}
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

/** Split the role into display lines: two words → two lines, longer → balanced halves. */
function splitRole(role: string): string[] {
  const words = role.trim().split(/\s+/);
  if (words.length <= 1) return words;
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}
