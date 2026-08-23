"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, type ReactNode } from "react";

interface GlassChipProps {
  children: ReactNode;
  className?: string;
  depth?: number;
}

export function GlassChip({ children, className, depth = 12 }: GlassChipProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 110, damping: 18, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 110, damping: 18, mass: 0.5 });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (event: PointerEvent) => {
      x.set((event.clientX / window.innerWidth - 0.5) * depth * -2);
      y.set((event.clientY / window.innerHeight - 0.5) * depth * -2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [depth, x, y]);

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      className={`absolute rounded-xl border border-white/10 bg-white/[0.045] px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md ${className ?? ""}`}
    >
      {children}
    </motion.div>
  );
}
