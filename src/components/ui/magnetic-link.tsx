"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { ReactNode } from "react";

const MAX_PULL = 12;
const REACH = 40;

interface MagneticLinkProps {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  ariaLabel?: string;
}

export function MagneticLink({
  children,
  className,
  href,
  onClick,
  ariaLabel,
}: MagneticLinkProps) {
  const anchorRef = useRef<HTMLElement | null>(null);
  const enabled = useRef(false);
  const hovered = useRef(false);
  const reducedMotion = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useSpring(1, { stiffness: 300, damping: 22 });
  const springX = useSpring(x, { stiffness: 180, damping: 15, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 180, damping: 15, mass: 0.5 });
  const innerX = useTransform(springX, (v) => v * -0.35);
  const innerY = useTransform(springY, (v) => v * -0.35);

  useEffect(() => {
    if (reducedMotion || typeof window === "undefined") return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }
    enabled.current = true;

    const onMove = (event: PointerEvent) => {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;

      const inside =
        Math.abs(dx) <= rect.width / 2 + REACH &&
        Math.abs(dy) <= rect.height / 2 + REACH;

      if (!inside) {
        x.set(0);
        y.set(0);
        hovered.current = false;
        scale.set(1);
        return;
      }

      let tx = dx * 0.35;
      let ty = dy * 0.35;
      const mag = Math.hypot(tx, ty);
      if (mag > MAX_PULL) {
        tx = (tx / mag) * MAX_PULL;
        ty = (ty / mag) * MAX_PULL;
      }
      x.set(tx);
      y.set(ty);

      const overElement =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      hovered.current = overElement;
      scale.set(overElement ? 1.04 : 1);

      el.style.setProperty("--bx", `${event.clientX - rect.left}px`);
      el.style.setProperty("--by", `${event.clientY - rect.top}px`);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reducedMotion, scale, x, y]);

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (!enabled.current || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    anchorRef.current.style.setProperty(
      "--bx",
      `${event.clientX - rect.left}px`,
    );
    anchorRef.current.style.setProperty(
      "--by",
      `${event.clientY - rect.top}px`,
    );
  }

  const setRef = (node: HTMLElement | null) => {
    anchorRef.current = node;
  };

  const shared = {
    className: `gpu-layer group relative overflow-hidden ${className ?? ""}`,
    style: { x: springX, y: springY, scale },
    onPointerMove: handlePointerMove,
  };

  const inner = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(110px circle at var(--bx, 50%) var(--by, 50%), rgba(255,255,255,0.16), transparent 65%)",
        }}
      />
      <motion.span
        style={{ x: innerX, y: innerY }}
        className="relative flex items-center gap-2"
      >
        {children}
      </motion.span>
    </>
  );

  if (href) {
    return (
      <motion.a ref={setRef} href={href} {...shared}>
        {inner}
      </motion.a>
    );
  }

  return (
    <motion.button
      ref={setRef}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      {...shared}
    >
      {inner}
    </motion.button>
  );
}
