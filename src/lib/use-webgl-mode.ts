"use client";

import { useEffect, useState } from "react";

export type FieldMode = "pending" | "webgl" | "static";

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    return Boolean(gl);
  } catch {
    return false;
  }
}

function supportsOffscreenCanvas(): boolean {
  try {
    return typeof OffscreenCanvas !== "undefined" &&
      typeof HTMLCanvasElement.prototype.transferControlToOffscreen === "function";
  } catch {
    return false;
  }
}

export function useFieldMode(): FieldMode {
  const [mode, setMode] = useState<FieldMode>("pending");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const mq = (query: string) => window.matchMedia(query).matches;
      const capable =
        supportsWebGL() &&
        supportsOffscreenCanvas() &&
        !mq("(prefers-reduced-motion: reduce)") &&
        !mq("(pointer: coarse)") &&
        !mq("(max-width: 820px)");
      setMode(capable ? "webgl" : "static");
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return mode;
}
