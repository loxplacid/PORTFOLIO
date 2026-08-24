"use client";

import { useEffect, useRef, useState } from "react";
import { heroWorkerBridge } from "@/lib/hero-worker-bridge";
import type { GpuTier } from "@/lib/use-gpu-tier";
import { FieldFallback } from "./field-fallback";

/** If the worker hasn't reported ready in this window, fall back to static. */
const READY_TIMEOUT_MS = 4000;

interface HeroSceneProps {
  active: boolean;
  tier: GpuTier;
  onFps?: (fps: number) => void;
  onVram?: (mb: number) => void;
  sectionIndex?: number;
}

export default function HeroScene({
  active,
  tier,
  onFps,
  onVram,
  sectionIndex = 0,
}: HeroSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // ── Init worker once ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // OffscreenCanvas is required; fall back gracefully if unavailable
    if (typeof canvas.transferControlToOffscreen !== "function") {
      setFailed(true);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (!cancelled) setFailed(true);
    }, READY_TIMEOUT_MS);

    heroWorkerBridge
      .init(canvas, tier)
      .then(() => {
        if (cancelled) return;
        window.clearTimeout(timeout);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        window.clearTimeout(timeout);
        setFailed(true);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      heroWorkerBridge.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once

  // ── FPS listener ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!onFps) return;
    const unsub = heroWorkerBridge.onFps(onFps);
    return () => { unsub(); };
  }, [onFps]);

  // ── VRAM listener ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!onVram) return;
    const unsub = heroWorkerBridge.onVram(onVram);
    return () => { unsub(); };
  }, [onVram]);

  // ── Pause / resume on visibility ────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    if (active) {
      heroWorkerBridge.resume();
    } else {
      heroWorkerBridge.pause();
    }
  }, [active, ready]);

  // ── Section transitions → VRAM disposal ────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    heroWorkerBridge.notifySection(sectionIndex);
  }, [sectionIndex, ready]);

  // ── Scroll velocity → chromatic aberration ──────────────────────────────────
  useEffect(() => {
    if (!ready) return;

    // Hook into Lenis scroll events if available, otherwise use wheel
    const onWheel = (e: WheelEvent) => {
      heroWorkerBridge.feedScrollVelocity(e.deltaY);
    };
    window.addEventListener("wheel", onWheel, { passive: true });

    // Also hook Lenis if it exposes a global scroll event
    const onLenis = (e: CustomEvent<{ velocity: number }>) => {
      heroWorkerBridge.feedScrollVelocity(e.detail.velocity * 60);
    };
    window.addEventListener("lenis-scroll" as keyof WindowEventMap, onLenis as EventListener);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("lenis-scroll" as keyof WindowEventMap, onLenis as EventListener);
    };
  }, [ready]);

  // ── Worker unavailable → static fallback (never a blank canvas) ────────────
  if (failed) {
    return <FieldFallback />;
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ display: "block", opacity: ready ? 1 : 0 }}
      aria-hidden
    />
  );
}
