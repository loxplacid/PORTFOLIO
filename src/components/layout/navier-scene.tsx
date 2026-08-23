"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { MONO_ACCENT } from "@/lib/color";
import { FluidSim, type SplatRequest } from "@/lib/fluid-sim";

const DISPLAY_FRAGMENT = `
precision highp float;
uniform sampler2D uDye;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uAccent;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;
  float jitter = (hash(floor(uv * uResolution / 2.0) + floor(uTime * 60.0)) - 0.5) * 0.0015;
  uv += vec2(jitter);

  vec3 dye = texture2D(uDye, uv).rgb;
  float lum = dot(dye, vec3(0.299, 0.587, 0.114));
  float bands = sin(lum * 9.0 + uTime * 0.35) * 0.5 + 0.5;

  vec3 col = vec3(0.02, 0.02, 0.024);
  col += vec3(0.07, 0.075, 0.09) * pow(clamp(lum * 1.6, 0.0, 1.0), 1.6);
  col += uAccent * pow(bands, 4.0) * 0.05;

  float vig = smoothstep(1.3, 0.35, length(uv - 0.5));
  col *= mix(0.7, 1.0, vig);

  gl_FragColor = vec4(col, 1.0);
}
`;

export function NavierScene({
  quality,
  onFallback,
}: {
  quality: "high" | "low";
  onFallback: () => void;
}) {
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const simRef = useRef<FluidSim | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const splats = useRef<SplatRequest[]>([]);
  const lastPointer = useRef({ x: 0.5, y: 0.5, t: 0 });
  const probeAt = useRef(0);
  const fallbackRef = useRef(onFallback);

  const displayUniforms = useMemo(
    () => ({
      uDye: { value: null as THREE.Texture | null },
      uResolution: {
        value: new THREE.Vector2(
          Math.max(1, Math.floor(window.innerWidth || 1)),
          Math.max(1, Math.floor(window.innerHeight || 1)),
        ),
      },
      uTime: { value: 0 },
      uAccent: { value: [...MONO_ACCENT] },
    }),
    [],
  );

  useEffect(() => {
    fallbackRef.current = onFallback;
  }, [onFallback]);

  useEffect(() => {
    try {
      const sim = new FluidSim(gl, quality);
      simRef.current = sim;
    } catch {
      fallbackRef.current();
    }
    return () => {
      simRef.current?.dispose();
      simRef.current = null;
    };
  }, [gl, quality]);

  useEffect(() => {
    if (!simRef.current || !materialRef.current) return;
    simRef.current.resize(gl.domElement.width, gl.domElement.height);
    materialRef.current.uniforms.uResolution.value.set(
      Math.max(1, Math.floor(size.width)),
      Math.max(1, Math.floor(size.height)),
    );
  }, [gl, size.width, size.height]);

  useEffect(() => {
    let queuedImpulse = false;

    const toUv = (x: number, y: number): [number, number] => [
      x / window.innerWidth,
      1 - y / window.innerHeight,
    ];

    const queueSplat = (splat: SplatRequest) => {
      splats.current.push(splat);
      if (splats.current.length > 24) splats.current.shift();
    };

    const onMove = (event: PointerEvent) => {
      const [ux, uy] = toUv(event.clientX, event.clientY);
      const now = performance.now();
      const dtms = Math.max(lastPointer.current.t ? now - lastPointer.current.t : 16.7, 1);
      const dx = ((event.clientX / window.innerWidth) - lastPointer.current.x) / dtms;
      const dy = -((event.clientY / window.innerHeight) - lastPointer.current.y) / dtms;
      lastPointer.current = { x: ux, y: uy, t: now };
      if (Math.abs(dx) < 1e-5 && Math.abs(dy) < 1e-5) return;
      queueSplat({
        x: ux,
        y: uy,
        dx: Math.max(-60, Math.min(60, dx * 600)),
        dy: Math.max(-60, Math.min(60, dy * 600)),
      });
    };

    const onDown = (event: PointerEvent) => {
      const [ux, uy] = toUv(event.clientX, event.clientY);
      queuedImpulse = true;
      queueSplat({ x: ux, y: uy, dx: 0, dy: 0, impulse: true });
      void queuedImpulse;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
    };
  }, []);

  useFrame((_, delta) => {
    const sim = simRef.current;
    const material = materialRef.current;
    if (!sim || !material || !sim.dyeTexture) return;

    const dt = Math.min(delta, 1 / 30);
    for (const splat of splats.current.splice(0, splats.current.length)) {
      sim.splat(splat);
    }

    sim.step(dt);

    if (performance.now() - probeAt.current > 150) {
      probeAt.current = performance.now();
      sim.updateProbe();
      updateHeadings(sim);
    }

    material.uniforms.uDye.value = sim.dyeTexture;
    material.uniforms.uTime.value += delta;
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position.xy, 0.0, 1.0);
          }
        `}
        fragmentShader={DISPLAY_FRAGMENT}
        uniforms={displayUniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

function updateHeadings(sim: FluidSim): void {
  const elements = document.querySelectorAll<HTMLElement>(
    "[data-fluid-heading]",
  );
  if (!elements.length) return;
  let maxEnergy = 0;

  elements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.bottom < -80 || rect.top > window.innerHeight + 80) {
      el.style.setProperty("--fluid-e", "0");
      return;
    }
    const u = (rect.left + rect.width / 2) / window.innerWidth;
    const v = 1 - (rect.top + rect.height / 2) / window.innerHeight;
    const energy = sim.sampleEnergy(u, v);
    maxEnergy = Math.max(maxEnergy, energy);
    el.style.setProperty("--fluid-e", energy.toFixed(3));
  });

  const mapEl = document.getElementById("ns-displace-map");
  mapEl?.setAttribute("scale", String(Math.round(Math.min(42, maxEnergy * 110))));
}
