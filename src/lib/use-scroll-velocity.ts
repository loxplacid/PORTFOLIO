"use client";

import { useEffect, useRef } from "react";
import { readScrollVelocity } from "@/components/layout/smooth-scroll";

/**
 * Returns a ref whose `.current` is always the latest Lenis scroll velocity.
 * Reads on every rAF — no React state, no re-renders.
 */
export function useScrollVelocityRef(): React.RefObject<number> {
  const ref = useRef(0);

  useEffect(() => {
    let id: number;
    const tick = () => {
      ref.current = readScrollVelocity();
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  return ref;
}
