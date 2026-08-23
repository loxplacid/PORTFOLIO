"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { readScrollVelocity } from "@/components/layout/smooth-scroll";

const BASE_DPR = 1.5;
const FPS_FLOOR = 58;
const WINDOW_MS = 2000;

interface QualityLevel {
  scale: number;
  blur: boolean;
}

const QUALITY_LEVELS: QualityLevel[] = [
  { scale: 1, blur: true },
  { scale: 0.75, blur: true },
  { scale: 0.5, blur: false },
];

const SCENE_FRAGMENT = `
precision highp float;
uniform float uTime;
varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p.yx + 34.23);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  vec2 p = vUv * 3.0;
  float drift = uTime * 0.04;
  float n = noise(p + drift) * 0.6 + noise(p * 2.1 - drift) * 0.4;
  float bands = sin((vUv.y + n * 0.35) * 12.0 - uTime * 0.25) * 0.5 + 0.5;

  vec3 col = vec3(0.024, 0.024, 0.03);
  col += vec3(0.05, 0.052, 0.062) * pow(n, 1.8);
  col += vec3(0.91, 0.915, 0.95) * pow(bands, 5.0) * 0.05;
  gl_FragColor = vec4(col, 1.0);
}
`;

const SCENE_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const LENS_VIGNETTE_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uDistortion: { value: 0.08 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uDistortion;
    varying vec2 vUv;

    void main() {
      vec2 centered = vUv - 0.5;
      float r2 = dot(centered, centered);
      vec2 distorted = vUv + centered * r2 * uDistortion * (0.85 + 0.15 * sin(uTime * 0.4));
      distorted = clamp(distorted, vec2(0.0), vec2(1.0));

      vec4 col = texture2D(tDiffuse, distorted);

      float vignette = smoothstep(0.92, 0.28, length(vUv - 0.5));
      col.rgb *= mix(0.52, 1.0, vignette);

      gl_FragColor = col;
    }
  `,
};

const RADIAL_BLUR_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    uScrollSpeed: { value: 0 },
    uStrengthCap: { value: 0.9 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uScrollSpeed;
    uniform float uStrengthCap;
    varying vec2 vUv;

    void main() {
      float strength = clamp(abs(uScrollSpeed) * 0.02, 0.0, 1.0) * uStrengthCap;
      vec2 direction = vUv - 0.5;

      vec4 sum = texture2D(tDiffuse, vUv);
      for (int i = 1; i <= 8; i++) {
        float factor = float(i) / 8.0;
        sum += texture2D(tDiffuse, vUv - direction * factor * strength * 0.14);
      }
      vec4 blurred = sum / 9.0;

      gl_FragColor = mix(texture2D(tDiffuse, vUv), blurred, strength);
    }
  `,
};

export interface PostProcessingPipelineProps {
  className?: string;
}

export default function PostProcessingPipeline({
  className,
}: PostProcessingPipelineProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [staticFallback, setStaticFallback] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const fallbackFrame = requestAnimationFrame(() => {
      if (reduced) setStaticFallback(true);
    });

    const canvas = document.createElement("canvas");
    mount.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(BASE_DPR);
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10);
    camera.position.z = 2;

    const planeHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    const planeWidth = planeHeight * camera.aspect;
    const planeMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: SCENE_VERTEX,
      fragmentShader: SCENE_FRAGMENT,
      depthWrite: false,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(planeWidth, planeHeight), planeMaterial);
    scene.add(plane);

    const composer = new EffectComposer(renderer);
    composer.setSize(window.innerWidth, window.innerHeight);
    composer.addPass(new RenderPass(scene, camera));

    const lensPass = new ShaderPass(LENS_VIGNETTE_SHADER);
    composer.addPass(lensPass);

    const radialPass = new ShaderPass(RADIAL_BLUR_SHADER);
    radialPass.renderToScreen = true;
    composer.addPass(radialPass);

    let levelIndex = 0;
    let cooldownUntil = 0;
    let lastFrameTime = performance.now();
    let smoothFps = 60;
    let smoothedScroll = 0;
    let disposed = false;

    function applyQuality(level: QualityLevel) {
      renderer.setPixelRatio(BASE_DPR * level.scale);
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      composer.setSize(window.innerWidth, window.innerHeight);
      radialPass.enabled = level.blur;
      lensPass.renderToScreen = !level.blur;
      radialPass.renderToScreen = level.blur;
    }

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    const loop = (time: number) => {
      if (disposed) return;
      requestAnimationFrame(loop);

      const deltaMs = Math.min(Math.max(time - lastFrameTime, 1), 100);
      lastFrameTime = time;
      const dt = deltaMs / 1000;

      const instantFps = 1000 / deltaMs;
      smoothFps = smoothFps * 0.92 + instantFps * 0.08;

      if (smoothFps < FPS_FLOOR && time > cooldownUntil && levelIndex < QUALITY_LEVELS.length - 1) {
        levelIndex += 1;
        applyQuality(QUALITY_LEVELS[levelIndex]);
        cooldownUntil = time + WINDOW_MS;
        smoothFps = FPS_FLOOR + 4;
      } else if (levelIndex > 0 && time > cooldownUntil && smoothFps > FPS_FLOOR + 12) {
        levelIndex -= 1;
        applyQuality(QUALITY_LEVELS[levelIndex]);
        cooldownUntil = time + WINDOW_MS;
      }

      smoothedScroll += (readScrollVelocity() / 45 - smoothedScroll) * 0.12;
      radialPass.uniforms.uScrollSpeed.value = smoothedScroll;
      radialPass.enabled = QUALITY_LEVELS[levelIndex].blur && Math.abs(smoothedScroll) > 0.02;
      lensPass.renderToScreen = !radialPass.enabled;

      planeMaterial.uniforms.uTime.value += dt;
      lensPass.uniforms.uTime.value += dt;

      composer.render(dt);
    };
    rafStart();

    function rafStart() {
      requestAnimationFrame(loop);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(fallbackFrame);
      window.removeEventListener("resize", onResize);
      plane.geometry.dispose();
      planeMaterial.dispose();
      radialPass.dispose?.();
      lensPass.dispose?.();
      composer.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  if (staticFallback) {
    return (
      <div
        ref={mountRef}
        aria-hidden
        className={className}
        style={{
          background:
            "radial-gradient(46rem 32rem at 74% 18%, rgba(255,255,255,0.06), transparent 64%), #050505",
        }}
      />
    );
  }

  return <div ref={mountRef} aria-hidden className={className} />;
}
