"use client";

import { useAnimationFrame } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useMounted } from "@/lib/use-mounted";
import { useScrollVelocityRef } from "@/lib/use-scroll-velocity";

// ─── Spring constants ─────────────────────────────────────────────────────────
// stiffness: 400, damping: 20 → underdamped (ratio 0.5), single clean overshoot
const K  = 400; // stiffness
const C  = 20;  // damping
const M  = 1;   // mass

// Influence radius around each character centre (px)
const RADIUS = 180;

// Variable-font axis rest / peak values
// Roboto Flex confirmed ranges: wght 100–1000, wdth 25–151, slnt -10–0, opsz 8–144
const WGHT_REST = 400;  const WGHT_PEAK = 900;
const WDTH_REST = 100;  const WDTH_PEAK = 125;
const SLNT_REST = 0;    const SLNT_PEAK = -10;
const OPSZ_REST = 14;   const OPSZ_PEAK = 80;

// Scroll-velocity → container skewX + letter-spacing
const SKEW_SCALE     = 0.018;  // deg per lenis velocity unit
const SKEW_MAX       = 14;     // deg cap
const LSPACE_SCALE   = 0.0004; // em per velocity unit
const LSPACE_MAX     = 0.06;   // em cap

// ─── Euler spring stepper ─────────────────────────────────────────────────────
interface Spring { pos: number; vel: number }

function step(s: Spring, target: number, dt: number): void {
  const safeDt = Math.min(dt, 0.064); // guard against tab-switch spikes
  s.vel += ((-K * (s.pos - target) - C * s.vel) / M) * safeDt;
  s.pos += s.vel * safeDt;
}

// ─── power4.out easing ───────────────────────────────────────────────────────
// t = normalised proximity [0 = far, 1 = centre]
// returns influence [0, 1] with steep falloff near the edge
function p4out(t: number): number {
  const i = 1 - t;
  return 1 - i * i * i * i;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface KineticTextProps {
  text: string;
  className?: string;
}

export function KineticText({ text, className }: KineticTextProps) {
  const mounted    = useMounted();
  const chars      = useMemo(() => Array.from(text), [text]);
  const holderRef  = useRef<HTMLSpanElement>(null);
  const spanRefs   = useRef<(HTMLSpanElement | null)[]>([]);
  const enabled    = useRef(false);
  const visible    = useRef(true);
  const pointer    = useRef({ x: -9999, y: -9999 });
  const scrollVel  = useScrollVelocityRef();

  // Per-char spring state arrays — one entry per axis per character
  const sw = useRef<Spring[]>([]); // wght
  const sd = useRef<Spring[]>([]); // wdth
  const sl = useRef<Spring[]>([]); // slnt
  const so = useRef<Spring[]>([]); // opsz

  // Container-level springs for scroll effects
  const skewSp   = useRef<Spring>({ pos: 0, vel: 0 });
  const lspaceSp = useRef<Spring>({ pos: 0, vel: 0 });

  // ── Reset spring arrays when text changes ──────────────────────────────────
  useEffect(() => {
    sw.current = chars.map(() => ({ pos: WGHT_REST, vel: 0 }));
    sd.current = chars.map(() => ({ pos: WDTH_REST, vel: 0 }));
    sl.current = chars.map(() => ({ pos: SLNT_REST, vel: 0 }));
    so.current = chars.map(() => ({ pos: OPSZ_REST, vel: 0 }));
  }, [chars]);

  // ── Pointer tracking ────────────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = e.clientX;
      pointer.current.y = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // ── Capability gate ─────────────────────────────────────────────────────────
  useEffect(() => {
    enabled.current =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // ── Visibility gate — skip work when scrolled off-screen ───────────────────
  useEffect(() => {
    const el = holderRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { visible.current = e.isIntersecting; },
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted]);

  // ── Animation loop ──────────────────────────────────────────────────────────
  // useCallback with empty deps → stable reference → useAnimationFrame
  // subscribes once and never re-subscribes on re-render.
  const idleSettled = useRef(false);

  const tick = useCallback((_t: number, deltaMs: number) => {
    if (!enabled.current || !visible.current) return;

    const h0 = holderRef.current;
    if (!h0) return;

    const dt = deltaMs / 1000; // ms → seconds for spring integration
    const px = pointer.current.x;
    const py = pointer.current.y;
    const n  = chars.length;

    // Coarse containment test: one rect read instead of n glyph reads.
    const cr      = h0.getBoundingClientRect();
    const reach   = Math.hypot(cr.width, cr.height) / 2 + RADIUS + 120;
    const outside = Math.hypot(px - (cr.left + cr.width / 2), py - (cr.top + cr.height / 2)) > reach;

    let maxStep = 0;

    for (let i = 0; i < n; i++) {
      const el = spanRefs.current[i];
      if (!el) continue;

      let influence = 0;
      if (!outside) {
        const r    = el.getBoundingClientRect();
        const dist = Math.hypot(r.left + r.width * 0.5 - px, r.top + r.height * 0.5 - py);
        influence  = p4out(Math.max(0, 1 - dist / RADIUS));
      }

      const beforeW = sw.current[i].pos;
      const beforeD = sd.current[i].pos;
      const beforeS = sl.current[i].pos;
      const beforeO = so.current[i].pos;

      step(sw.current[i], WGHT_REST + influence * (WGHT_PEAK - WGHT_REST), dt);
      step(sd.current[i], WDTH_REST + influence * (WDTH_PEAK - WDTH_REST), dt);
      step(sl.current[i], SLNT_REST + influence * (SLNT_PEAK - SLNT_REST), dt);
      step(so.current[i], OPSZ_REST + influence * (OPSZ_PEAK - OPSZ_REST), dt);

      maxStep = Math.max(
        maxStep,
        Math.abs(sw.current[i].pos - beforeW),
        Math.abs(sd.current[i].pos - beforeD),
        Math.abs(sl.current[i].pos - beforeS),
        Math.abs(so.current[i].pos - beforeO),
      );

      if (!outside || !idleSettled.current) {
        el.style.fontVariationSettings =
          `'wght' ${sw.current[i].pos.toFixed(1)},` +
          ` 'wdth' ${sd.current[i].pos.toFixed(1)},` +
          ` 'slnt' ${sl.current[i].pos.toFixed(2)},` +
          ` 'opsz' ${so.current[i].pos.toFixed(1)}`;
      }
    }

    // Container scroll-velocity skew + letter-spacing stretch
    const vel    = scrollVel.current;
    const tSkew  = Math.max(-SKEW_MAX,  Math.min(SKEW_MAX,  -vel * SKEW_SCALE));
    const tLsp   = Math.max(0,          Math.min(LSPACE_MAX, Math.abs(vel) * LSPACE_SCALE));

    step(skewSp.current,   tSkew, dt);
    step(lspaceSp.current, tLsp,  dt);

    if (!outside || Math.abs(skewSp.current.pos) > 0.01 || lspaceSp.current.pos > 0.002) {
      const h = holderRef.current;
      if (h) {
        h.style.display       = "inline-block";
        h.style.transform     = `skewX(${skewSp.current.pos.toFixed(3)}deg)`;
        h.style.letterSpacing = `${lspaceSp.current.pos.toFixed(4)}em`;
      }
    }

    idleSettled.current = outside && maxStep < 0.05;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — reads everything via refs

  useAnimationFrame(tick);

  // ── SSR fallback ────────────────────────────────────────────────────────────
  if (!mounted) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span ref={holderRef} className={className} aria-label={text}>
      {chars.map((char, i) =>
        char === " " ? (
          <span key={i} aria-hidden>{"\u00A0"}</span>
        ) : (
          <span
            key={i}
            aria-hidden
            ref={(el) => { spanRefs.current[i] = el; }}
            className="inline-block will-change-[font-variation-settings]"
            style={{
              fontVariationSettings:
                `'wght' ${WGHT_REST}, 'wdth' ${WDTH_REST}, 'slnt' ${SLNT_REST}, 'opsz' ${OPSZ_REST}`,
            }}
          >
            {char}
          </span>
        ),
      )}
    </span>
  );
}
