"use client";

import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { detectFluidSupport, type FluidMode } from "@/lib/fluid-sim";
import { NavierScene } from "./navier-scene";

function NoiseCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = 0;

    const resize = () => {
      canvas.width = Math.max(2, Math.floor(window.innerWidth / 4));
      canvas.height = Math.max(2, Math.floor(window.innerHeight / 4));
    };
    resize();
    window.addEventListener("resize", resize);

    interface Blob {
      x: number;
      y: number;
      r: number;
      vx: number;
      vy: number;
      a: number;
    }
    const blobs: Blob[] = Array.from({ length: 7 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.18 + Math.random() * 0.3,
      vx: (Math.random() - 0.5) * 0.0016,
      vy: (Math.random() - 0.5) * 0.0016,
      a: 0.03 + Math.random() * 0.05 + (i === 0 ? 0.04 : 0),
    }));

    const draw = (time: number) => {
      raf = requestAnimationFrame(draw);
      if (time - last < 66) return;
      last = time;

      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const blob of blobs) {
        blob.x += blob.vx;
        blob.y += blob.vy;
        if (blob.x < blob.r || blob.x > 1 - blob.r) blob.vx *= -1;
        if (blob.y < blob.r || blob.y > 1 - blob.r) blob.vy *= -1;
        const grad = ctx.createRadialGradient(
          blob.x * canvas.width,
          blob.y * canvas.height,
          0,
          blob.x * canvas.width,
          blob.y * canvas.height,
          blob.r * Math.min(canvas.width, canvas.height),
        );
        grad.addColorStop(0, `rgba(235,235,245,${blob.a})`);
        grad.addColorStop(1, "rgba(235,235,245,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}

function StaticFallback() {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(48rem 34rem at 78% 16%, rgba(255,255,255,0.07), transparent 65%)," +
          "radial-gradient(36rem 26rem at 10% 85%, rgba(255,255,255,0.035), transparent 60%)",
      }}
    />
  );
}

export function Backdrop() {
  const [mode, setMode] = useState<FluidMode>("static");
  const [dpr, setDpr] = useState<number>(1.5);
  const [simQuality, setSimQuality] = useState<"high" | "low">("high");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduced) {
        setMode("static");
        return;
      }
      setMode(detectFluidSupport() ? "ns" : "canvas2d");
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: -1 }}
    >
      {mode === "static" ? <StaticFallback /> : null}
      {mode === "canvas2d" ? <NoiseCanvas /> : null}
      {mode === "ns" ? (
        <div
          className="absolute inset-0 opacity-0"
          style={{ animation: "fade-in-backdrop 1.2s ease-out forwards" }}
        >
          <Canvas
            dpr={dpr}
            gl={{
              antialias: false,
              alpha: false,
              powerPreference: "high-performance",
            }}
          >
            <PerformanceMonitor
              bounds={() => [55, 100]}
              flipflops={2}
              onDecline={() =>
                setDpr((current) => Math.max(0.75, current - 0.35))
              }
              onFallback={() => {
                if (simQuality === "high") setSimQuality("low");
                else setMode("canvas2d");
              }}
            >
              <NavierScene quality={simQuality} onFallback={() => setMode("canvas2d")} />
            </PerformanceMonitor>
          </Canvas>
        </div>
      ) : null}
    </div>
  );
}
