"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ShaderMaterial } from "three";
import { Vector2 } from "three";
import { oklchToRgb } from "@/lib/color";
import type { Project } from "@/data/projects";

/**
 * DECORATIVE SHADER PLACEHOLDER — not a project demo.
 *
 * This canvas renders an abstract motif keyed off each placeholder entry's
 * hue/variant so case-study layouts can be evaluated before real media
 * exists. It must never be presented as footage of the actual project; the
 * surrounding <ProjectMedia> frame labels it as decorative.
 */

const QUAD_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const QUAD_FRAGMENT = `
uniform float uTime;
uniform float uVariant;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform vec3 uAccent;
varying vec2 vUv;

float ring(vec2 p, vec2 c, float radius, float width) {
  return smoothstep(width, 0.0, abs(length(p - c) - radius));
}

void main() {
  vec2 p = vUv * uRes;
  vec2 m = uMouse * uRes;
  float md = length(p - m);
  p += normalize(p - m + 0.001) * sin(md * 0.06 - uTime * 3.0) * exp(-md * 0.012) * 14.0;

  float t = uTime * 0.5;
  vec2 c = uRes * 0.5;
  vec3 col = vec3(0.02, 0.02, 0.025);

  if (uVariant < 0.5) {
    for (int i = 1; i <= 6; i++) {
      float r = float(i) * min(uRes.x, uRes.y) * 0.07 + sin(t + float(i)) * 8.0;
      col += uAccent * ring(p, c, r, 1.6) * (0.55 - float(i) * 0.06);
    }
  } else if (uVariant < 1.5) {
    float beams = sin((p.x + p.y) * 0.05 - t * 2.0) * 0.5 + 0.5;
    col += uAccent * pow(beams, 6.0) * 0.35;
    float sweep = smoothstep(60.0, 0.0, abs(mod(p.y - t * 40.0, uRes.y) - uRes.y * 0.5));
    col += uAccent * sweep * 0.25;
  } else if (uVariant < 2.5) {
    float orbit = ring(p, c + vec2(sin(t * 0.7), cos(t * 0.7)) * uRes.x * 0.08, uRes.x * 0.11, 2.0);
    float core = exp(-length(p - c) * 0.02);
    col += uAccent * orbit * 0.9 + uAccent * core * 0.4;
  } else {
    vec2 g = abs(fract(p / 48.0) - 0.5);
    float lines = smoothstep(0.47, 0.5, max(g.x, g.y));
    col += vec3(0.10) * lines;
    float cross = smoothstep(2.0, 0.0, min(abs(p.x - c.x * 0.6), abs(p.y - c.y * 0.7)));
    col += uAccent * cross * 0.8;
    col += uAccent * exp(-length(p - c) * 0.015) * 0.22;
  }

  col += uAccent * exp(-md * 0.010) * 0.12;
  gl_FragColor = vec4(col, 1.0);
}
`;

function PreviewQuad({ project }: { project: Project }) {
  const materialRef = useRef<ShaderMaterial>(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uVariant: { value: variantIndex(project.variant) },
      uRes: { value: new Vector2(size.width, size.height) },
      uMouse: { value: new Vector2(0.5, 0.5) },
      uAccent: { value: [...oklchToRgb(0.87, 0.19, project.hue)] },
    }),
    [project.variant, project.hue, size.width, size.height],
  );

  useEffect(() => {
    uniforms.uRes.value.set(size.width, size.height);
  }, [size, uniforms]);

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.uTime.value += delta;
    const targetX = state.pointer.x * 0.5 + 0.5;
    const targetY = state.pointer.y * 0.5 + 0.5;
    const damp = Math.min(1, delta * 3);
    material.uniforms.uMouse.value.x +=
      (targetX - material.uniforms.uMouse.value.x) * damp;
    material.uniforms.uMouse.value.y +=
      (targetY - material.uniforms.uMouse.value.y) * damp;
  });

  return (
    <mesh scale={[size.width, size.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={QUAD_VERTEX}
        fragmentShader={QUAD_FRAGMENT}
        uniforms={uniforms}
      />
    </mesh>
  );
}

function variantIndex(variant: Project["variant"]): number {
  switch (variant) {
    case "contours":
      return 0;
    case "beams":
      return 1;
    case "orbit":
      return 2;
    default:
      return 3;
  }
}

/** Render callback handed to <ProjectMedia kind="webgl-placeholder">. */
export function ShaderPlaceholderRenderer({ project }: { project: Project }) {
  function ShaderPlaceholderCanvas({ paused }: { paused: boolean }) {
    return (
      <Canvas
        orthographic
        dpr={[1, 1.5]}
        frameloop={paused ? "never" : "always"}
        camera={{ position: [0, 0, 10], zoom: 1 }}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      >
        <PreviewQuad project={project} />
      </Canvas>
    );
  }
  ShaderPlaceholderCanvas.displayName = "ShaderPlaceholderCanvas";
  return ShaderPlaceholderCanvas;
}

interface LiveDemoFrameProps {
  url: string;
  title: string;
}

/**
 * Verified-demo iframe. Rendered ONLY when a project's demoUrl resolves
 * (verified status, or explicit demo-mode layout preview).
 */
export function LiveDemoFrame({ url, title }: LiveDemoFrameProps) {
  const [frameReady, setFrameReady] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-line bg-surface">
      {!frameReady ? (
        <div aria-hidden className="absolute inset-0 animate-pulse bg-surface" />
      ) : null}
      <iframe
        src={url}
        title={`${title} live demo`}
        loading="lazy"
        onLoad={() => setFrameReady(true)}
        referrerPolicy="no-referrer"
        allow="fullscreen"
        className={`aspect-video h-full w-full transition-opacity duration-500 ${
          frameReady ? "opacity-100" : "opacity-0"
        }`}
      />
      <span className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-line bg-surface/80 px-2.5 py-1.5 font-mono text-micro text-dim backdrop-blur-sm">
        Live demo — {new URL(url).host}
      </span>
    </div>
  );
}
