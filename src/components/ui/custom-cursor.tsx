"use client";

import {
  motion,
  useAnimationFrame,
  useMotionValue,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useMounted } from "@/lib/use-mounted";

const INTERACTIVE = 'a, button, [role="button"], [data-cursor]';
const BASE_RING = 40;

export function CustomCursor() {
  const mounted = useMounted();
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const enabled = useRef(false);
  const mouse = useRef({ x: -100, y: -100 });
  const dot = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100, px: -100, py: -100 });
  const hovered = useRef<HTMLElement | null>(null);
  const pressed = useRef(false);
  const candidates = useRef<HTMLElement[]>([]);
  const frameCount = useRef(0);

  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);
  const ringX = useMotionValue(-100);
  const ringY = useMotionValue(-100);
  const ringScale = useMotionValue(1);
  const ringRotate = useMotionValue(0);
  const ringSquashX = useMotionValue(1);
  const ringSquashY = useMotionValue(1);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!fine || reduced) return;
    enabled.current = true;
    const frame = requestAnimationFrame(() => setActive(true));
    document.documentElement.classList.add("spatial-cursor");

    const onMove = (event: PointerEvent) => {
      mouse.current.x = event.clientX;
      mouse.current.y = event.clientY;
      setVisible(true);
      const el = (event.target as HTMLElement | null)?.closest?.(
        INTERACTIVE,
      ) as HTMLElement | null;
      hovered.current = el && document.contains(el) ? el : null;
    };
    const onDown = () => {
      pressed.current = true;
    };
    const onUp = () => {
      pressed.current = false;
    };
    const onLeave = () => {
      setVisible(false);
    };

    const refreshCandidates = () => {
      candidates.current = Array.from(
        document.querySelectorAll<HTMLElement>(INTERACTIVE),
      );
    };
    refreshCandidates();
    const refreshId = window.setInterval(refreshCandidates, 800);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.clearInterval(refreshId);
      cancelAnimationFrame(frame);
      enabled.current = false;
      document.documentElement.classList.remove("spatial-cursor");
    };
  }, []);

  useAnimationFrame((_, delta) => {
    if (!enabled.current) return;
    const dt = Math.min(delta, 0.05);

    let targetX = mouse.current.x;
    let targetY = mouse.current.y;
    let magnetScale = 1;

    frameCount.current += 1;
    if (!hovered.current && frameCount.current % 2 === 0) {
      const cx = mouse.current.x;
      const cy = mouse.current.y;
      let best: HTMLElement | null = null;
      let bestDist = 30;
      for (const el of candidates.current) {
        if (!document.contains(el)) continue;
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -60 || rect.top > window.innerHeight + 60) continue;
        const dx = Math.max(rect.left - cx, 0, cx - rect.right);
        const dy = Math.max(rect.top - cy, 0, cy - rect.bottom);
        const dist = Math.hypot(dx, dy);
        if (dist < bestDist) {
          bestDist = dist;
          best = el;
        }
      }
      if (best) {
        const rect = best.getBoundingClientRect();
        const pull = (1 - bestDist / 30) * 0.5;
        targetX += (rect.left + rect.width / 2 - targetX) * pull;
        targetY += (rect.top + rect.height / 2 - targetY) * pull;
        magnetScale = 1 + (1 - bestDist / 30) * 0.3;
      }
    }

    const el = hovered.current;
    if (el && document.contains(el)) {
      const rect = el.getBoundingClientRect();
      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
      magnetScale = Math.min(
        2.4,
        Math.max(1, Math.max(rect.width, rect.height) / BASE_RING),
      );
    }

    const kDot = 1 - Math.exp(-dt / (hovered.current ? 0.09 : 0.04));
    const kRing = 1 - Math.exp(-dt / 0.13);

    dot.current.x += (targetX - dot.current.x) * kDot;
    dot.current.y += (targetY - dot.current.y) * kDot;

    ring.current.px = ring.current.x;
    ring.current.py = ring.current.y;
    ring.current.x += (targetX - ring.current.x) * kRing;
    ring.current.y += (targetY - ring.current.y) * kRing;

    const velX = ((ring.current.x - ring.current.px) / Math.max(dt, 0.001)) * 0.06;
    const velY = ((ring.current.y - ring.current.py) / Math.max(dt, 0.001)) * 0.06;
    const speed = Math.hypot(velX, velY);
    const stretch = Math.min(0.38, speed * 0.012);
    const angle = Math.atan2(velY, velX) * 57.2958;

    dotX.set(dot.current.x);
    dotY.set(dot.current.y);
    ringX.set(ring.current.x);
    ringY.set(ring.current.y);
    ringRotate.set(angle);
    ringSquashX.set(1 + stretch);
    ringSquashY.set(1 - stretch);
    ringScale.set(magnetScale * (pressed.current ? 0.88 : 1));
  });

  if (!mounted || !active) return null;

  return (
    <>
      <motion.div
        aria-hidden
        className="gpu-layer pointer-events-none fixed left-0 top-0 z-[100]"
        style={{ x: dotX, y: dotY, opacity: visible ? 1 : 0 }}
      >
        <div className="-ml-[3px] -mt-[3px] size-1.5 rounded-full bg-white mix-blend-difference" />
      </motion.div>
      <motion.div
        aria-hidden
        className="gpu-layer pointer-events-none fixed left-0 top-0 z-[100]"
        style={{
          x: ringX,
          y: ringY,
          rotate: ringRotate,
          scale: ringScale,
          scaleX: ringSquashX,
          scaleY: ringSquashY,
          opacity: visible ? 1 : 0,
        }}
      >
        <div className="-ml-5 -mt-5 size-10 rounded-full border border-white/50 mix-blend-difference transition-colors duration-200" />
      </motion.div>
    </>
  );
}
