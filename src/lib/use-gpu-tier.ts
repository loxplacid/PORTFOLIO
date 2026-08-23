"use client";

import { useEffect, useState } from "react";

export type GpuTier = "high" | "low";

interface ExtendedNavigator extends Navigator {
  deviceMemory?: number;
}

export function useGpuTier(): GpuTier {
  const [tier, setTier] = useState<GpuTier>("high");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const nav = navigator as ExtendedNavigator;
      const low =
        window.matchMedia("(pointer: coarse)").matches ||
        (nav.hardwareConcurrency ?? 8) <= 4 ||
        (nav.deviceMemory ?? 8) <= 4;
      setTier(low ? "low" : "high");
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return tier;
}
