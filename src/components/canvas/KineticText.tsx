"use client";

import { useEffect, useRef } from "react";
import { getSharedEngine, VerletPoint } from "@/lib/physics/verletEngine";

const WARP_RADIUS = 150;
const MIN_WEIGHT = 400;
const MAX_WEIGHT = 900;
const MIN_WIDTH = 80;
const MAX_WIDTH = 140;

export interface KineticTextProps {
  text: string;
  className?: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  align?: CanvasTextAlign;
}

interface Glyph {
  char: string;
  x: number;
  y: number;
  width: number;
  height: number;
  point: VerletPoint;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function interpolate(min: number, max: number, amount: number): number {
  return min + (max - min) * amount;
}

export function KineticText({
  text,
  className,
  fontFamily = "var(--font-display), sans-serif",
  fontSize = 96,
  color = "currentColor",
  align = "center",
}: KineticTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const engine = getSharedEngine();
    const pointer = { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY };
    let glyphs: Glyph[] = [];
    let frameId = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);

      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.textBaseline = "alphabetic";
      context.textAlign = "left";
      context.font = `400 ${fontSize}px ${fontFamily}`;

      glyphs.forEach(({ point }) => engine.remove(point));
      const measuredGlyphs: Glyph[] = [];
      const totalWidth = Array.from(text).reduce(
        (widthSoFar, char) => widthSoFar + context.measureText(char).width,
        0,
      );
      let x = align === "center" ? (width - totalWidth) / 2 : align === "right" ? width - totalWidth : 0;
      const baseline = (height + fontSize) / 2;

      for (const char of Array.from(text)) {
        const metrics = context.measureText(char);
        const point = new VerletPoint({
          x,
          y: baseline,
          friction: 0.84,
        });
        point.setTarget(x, baseline);
        engine.add(point);
        measuredGlyphs.push({
          char,
          x,
          y: baseline,
          width: metrics.width,
          height: (metrics.actualBoundingBoxAscent || fontSize) +
            (metrics.actualBoundingBoxDescent || 0),
          point,
        });
        x += metrics.width;
      }

      glyphs = measuredGlyphs;
    };

    const updatePointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    };

    const clearPointer = () => {
      pointer.x = Number.POSITIVE_INFINITY;
      pointer.y = Number.POSITIVE_INFINITY;
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      context.clearRect(0, 0, rect.width, rect.height);
      context.textBaseline = "alphabetic";
      context.fillStyle = color;

      glyphs.forEach((glyph) => {
        const dist = Math.hypot(pointer.x - glyph.point.x, pointer.y - glyph.point.y);
        const influence = clamp(1 - dist / WARP_RADIUS, 0, 1);
        const weight = Math.round(interpolate(MIN_WEIGHT, MAX_WEIGHT, influence));
        const width = Math.round(interpolate(MIN_WIDTH, MAX_WIDTH, influence));

        if (Number.isFinite(pointer.x) && dist < WARP_RADIUS) {
          glyph.point.repelFrom(pointer.x, pointer.y, WARP_RADIUS, 0.18);
        }

        context.font = `${weight} ${width}% ${fontSize}px ${fontFamily}`;
        context.fillText(glyph.char, glyph.point.x, glyph.point.y);
      });

      frameId = requestAnimationFrame(draw);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    canvas.addEventListener("pointermove", updatePointer);
    canvas.addEventListener("pointerleave", clearPointer);
    frameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      canvas.removeEventListener("pointermove", updatePointer);
      canvas.removeEventListener("pointerleave", clearPointer);
      glyphs.forEach(({ point }) => engine.remove(point));
    };
  }, [align, color, fontFamily, fontSize, text]);

  return <canvas ref={canvasRef} className={className} aria-label={text} role="img" />;
}