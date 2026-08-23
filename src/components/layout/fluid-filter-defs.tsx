"use client";

import { useUIStore } from "@/store/ui-store";

export function FluidFilterDefs() {
  const theme = useUIStore((s) => s.theme);

  if (theme === "light") return null;

  return (
    <svg
      aria-hidden
      focusable="false"
      className="pointer-events-none absolute h-0 w-0"
    >
      <filter
        id="ns-displace"
        x="-20%"
        y="-20%"
        width="140%"
        height="140%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.012 0.02"
          numOctaves={2}
          seed={7}
          result="fluidNoise"
        />
        <feGaussianBlur in="fluidNoise" stdDeviation="1.2" result="softNoise" />
        <feDisplacementMap
          id="ns-displace-map"
          in="SourceGraphic"
          in2="softNoise"
          scale={0}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
