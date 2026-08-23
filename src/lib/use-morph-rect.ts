"use client";

import { useCallback, useRef } from "react";

export interface MorphRect {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: string;
}

/**
 * Returns a [ref, capture] pair.
 * Attach `ref` to the trigger element.
 * Call `capture()` just before opening the modal to snapshot the rect.
 * Read `rectRef.current` inside the portal.
 */
export function useMorphRect(): [
  React.RefObject<HTMLElement | null>,
  () => MorphRect | null,
  React.RefObject<MorphRect | null>,
] {
  const triggerRef = useRef<HTMLElement | null>(null);
  const rectRef = useRef<MorphRect | null>(null);

  const capture = useCallback((): MorphRect | null => {
    const el = triggerRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const computed = window.getComputedStyle(el);
    const rect: MorphRect = {
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
      borderRadius: computed.borderRadius,
    };
    rectRef.current = rect;
    return rect;
  }, []);

  return [triggerRef, capture, rectRef];
}
