"use client";

import { useEffect, useRef, useState } from "react";

const VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 aPos;
in vec2 aUv;
in vec3 aNormal;

uniform float uTime;
uniform float uDisplace;

out vec2 vUv;
out vec3 vNormal;
out float vDisplace;

vec3 mod289(vec3 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec2 ox = floor(x + 0.5);
  vec2 a0 = x - ox;
  m *= taylorInvSqrt(vec4(dot(a0,a0), dot(h,h), dot(a0,a0), dot(h,h)));
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vUv = aUv;
  vNormal = aNormal;

  float n = snoise(aUv * 3.0 + uTime * 0.15)
          + 0.5 * snoise(aUv * 6.0 - uTime * 0.22);
  float displacement = n * uDisplace;

  vDisplace = displacement;
  vec3 displaced = vec3(aPos, 0.0) + aNormal * displacement;

  gl_Position = vec4(displaced.xy, displaced.z, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 vUv;
in vec3 vNormal;
in float vDisplace;

uniform sampler2D uTexture;
uniform vec2 uMouse;
uniform vec2 uVelocity;
uniform float uTime;
uniform vec2 uResolution;
uniform float uIntensity;

out vec4 fragColor;

float hash(vec2 p) {
  p = fract(p * vec2(443.897, 441.423));
  p += dot(p, p.yx + 19.19);
  return fract((p.x + p.y) * p.x);
}

void main() {
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 toMouse = (vUv - uMouse) * aspect;
  float dist = length(toMouse);
  float falloff = exp(-dist * 5.0);

  float speed = length(uVelocity);
  vec2 dir = normalize(toMouse + vec2(1e-5));

  vec2 refractOffset = dir * falloff * (0.02 + speed * 0.10) * uIntensity;
  vec2 swirl = vec2(-uVelocity.y, uVelocity.x) * falloff * 0.04 * uIntensity;
  vec2 warp = (refractOffset + swirl) * sign(length(uVelocity) + 0.001);

  vec2 uvR = clamp(vUv + warp * 1.18 + dir * speed * 0.006, vec2(0.0), vec2(1.0));
  vec2 uvG = clamp(vUv + warp, vec2(0.0), vec2(1.0));
  vec2 uvB = clamp(vUv + warp * 0.84 - dir * speed * 0.004, vec2(0.0), vec2(1.0));

  vec3 col;
  col.r = texture(uTexture, uvR).r;
  col.g = texture(uTexture, uvG).g;
  col.b = texture(uTexture, uvB).b;

  float sheen = falloff * pow(1.0 - abs(vNormal.z), 1.5) + vDisplace * 0.35;
  col += vec3(0.06, 0.065, 0.075) * clamp(sheen, 0.0, 1.0);

  col *= 0.97 + 0.03 * vNormal.z;

  float grain = hash(vUv * uResolution + fract(uTime * 0.61) * 371.7) - 0.5;
  col += grain * (0.014 + 0.01 * falloff);

  fragColor = vec4(col, 1.0);
}
`;

interface GLResources {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  indexCount: number;
  texture: WebGLTexture;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

function buildGrid(segments: number) {
  const positions = new Float32Array((segments + 1) ** 2 * 2);
  const uvs = new Float32Array((segments + 1) ** 2 * 2);
  const normals = new Float32Array((segments + 1) ** 2 * 3);
  const indices = new Uint32Array(segments * segments * 6);

  let vertex = 0;
  for (let y = 0; y <= segments; y++) {
    for (let x = 0; x <= segments; x++) {
      const u = x / segments;
      const v = y / segments;
      positions[vertex * 2] = u * 2 - 1;
      positions[vertex * 2 + 1] = 1 - v * 2;
      uvs[vertex * 2] = u;
      uvs[vertex * 2 + 1] = v;
      normals[vertex * 3] = 0;
      normals[vertex * 3 + 1] = 0;
      normals[vertex * 3 + 2] = 1;
      vertex += 1;
    }
  }

  let index = 0;
  for (let y = 0; y < segments; y++) {
    for (let x = 0; x < segments; x++) {
      const a = y * (segments + 1) + x;
      const b = a + 1;
      const c = a + segments + 1;
      const d = c + 1;
      indices[index++] = a;
      indices[index++] = c;
      indices[index++] = b;
      indices[index++] = b;
      indices[index++] = c;
      indices[index++] = d;
    }
  }

  return { positions, uvs, normals, indices };
}

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("FluidShaderCanvas shader error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function linkProgram(gl: WebGL2RenderingContext): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("FluidShaderCanvas link error:", gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

function makeProceduralCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const gradient = ctx.createRadialGradient(320, 180, 20, 256, 256, 420);
  gradient.addColorStop(0, "#232328");
  gradient.addColorStop(0.55, "#101013");
  gradient.addColorStop(1, "#050505");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  for (let i = 0; i < 14; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 38 + Math.sin(i) * 12);
    ctx.bezierCurveTo(170, i * 30 + 20, 340, i * 46 - 14, 512, i * 36 + 6);
    ctx.stroke();
  }
  return canvas;
}

function uploadTexture(gl: WebGL2RenderingContext, source: TexImageSource): WebGLTexture {
  const texture = gl.createTexture();
  if (!texture) throw new Error("texture allocation failed");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

function initGL(canvas: HTMLCanvasElement, textureSrc?: string): GLResources | null {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;

  const program = linkProgram(gl);
  if (!program) return null;

  const grid = buildGrid(96);
  const vao = gl.createVertexArray();
  if (!vao) return null;
  gl.bindVertexArray(vao);

  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, grid.positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const uvBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
  gl.bufferData(gl.ARRAY_BUFFER, grid.uvs, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

  const normalBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuf);
  gl.bufferData(gl.ARRAY_BUFFER, grid.normals, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);

  const indexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, grid.indices, gl.STATIC_DRAW);

  let texture: WebGLTexture;
  try {
    texture = uploadTexture(gl, makeProceduralCanvas());
  } catch {
    return null;
  }

  if (textureSrc) {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    };
    image.src = textureSrc;
  }

  gl.bindVertexArray(null);
  gl.useProgram(program);

  const uniformNames = [
    "uTime",
    "uDisplace",
    "uTexture",
    "uMouse",
    "uVelocity",
    "uResolution",
    "uIntensity",
  ];
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  for (const name of uniformNames) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }

  return {
    gl,
    program,
    vao,
    indexCount: grid.indices.length,
    texture,
    uniforms,
  };
}

export interface FluidShaderCanvasProps {
  className?: string;
  intensity?: number;
  paused?: boolean;
  textureSrc?: string;
}

export default function FluidShaderCanvas({
  className,
  intensity = 1,
  paused = false,
  textureSrc,
}: FluidShaderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resourcesRef = useRef<GLResources | null>(null);
  const rafRef = useRef(0);
  const pointerTarget = useRef({ x: 0.5, y: 0.5 });
  const mouseSmooth = useRef({ x: 0.5, y: 0.5 });
  const velocity = useRef({ x: 0, y: 0 });
  const lastFrame = useRef(0);
  const timeRef = useRef(0);
  const pausedRef = useRef(paused);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onPointerMove = (event: PointerEvent) => {
      pointerTarget.current.x = event.clientX / window.innerWidth;
      pointerTarget.current.y = 1 - event.clientY / window.innerHeight;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const onContextLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(rafRef.current);
      resourcesRef.current = null;
    };
    const onContextRestored = () => {
      resourcesRef.current = initGL(canvas, textureSrc);
      lastFrame.current = 0;
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    const frame = (timestamp: number) => {
      rafRef.current = requestAnimationFrame(frame);
      const resources = resourcesRef.current;
      if (!resources || pausedRef.current) {
        lastFrame.current = timestamp;
        return;
      }
      const { gl } = resources;

      const dtms = Math.max(lastFrame.current ? timestamp - lastFrame.current : 16.7, 1);
      const dt = Math.min(dtms / 1000, 0.05);

      const rawVX = ((pointerTarget.current.x - mouseSmooth.current.x) / (dtms / 1000)) * 0.05;
      const rawVY = ((pointerTarget.current.y - mouseSmooth.current.y) / (dtms / 1000)) * 0.05;
      velocity.current.x =
        velocity.current.x * 0.9 + Math.max(-2, Math.min(2, rawVX)) * 0.1;
      velocity.current.y =
        velocity.current.y * 0.9 + Math.max(-2, Math.min(2, rawVY)) * 0.1;
      mouseSmooth.current.x += (pointerTarget.current.x - mouseSmooth.current.x) * 0.08;
      mouseSmooth.current.y += (pointerTarget.current.y - mouseSmooth.current.y) * 0.08;

      timeRef.current += dt;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const width = Math.floor(canvas.clientWidth * dpr);
      const height = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

      gl.useProgram(resources.program);
      gl.bindVertexArray(resources.vao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, resources.texture);
      gl.uniform1i(resources.uniforms.uTexture, 0);
      gl.uniform1f(resources.uniforms.uTime, timeRef.current);
      gl.uniform1f(resources.uniforms.uDisplace, 0.08 * intensity);
      gl.uniform1f(resources.uniforms.uIntensity, intensity);
      gl.uniform2f(resources.uniforms.uResolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform2f(resources.uniforms.uMouse, mouseSmooth.current.x, mouseSmooth.current.y);
      gl.uniform2f(resources.uniforms.uVelocity, velocity.current.x, velocity.current.y);

      gl.drawElements(gl.TRIANGLES, resources.indexCount, gl.UNSIGNED_INT, 0);

      lastFrame.current = timestamp;
    };

    const boot = () => {
      resourcesRef.current = initGL(canvas, textureSrc);
      if (!resourcesRef.current) {
        setFailed(true);
        return;
      }
      rafRef.current = requestAnimationFrame(frame);
    };

    const bootRaf = requestAnimationFrame(() => boot());

    return () => {
      cancelAnimationFrame(bootRaf);
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      resourcesRef.current = null;
    };
  }, [intensity, textureSrc]);

  if (failed) {
    return (
      <div
        aria-hidden
        className={className}
        style={{
          background:
            "radial-gradient(42rem 30rem at 72% 20%, rgba(255,255,255,0.06), transparent 62%), #050505",
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`h-full w-full ${className ?? ""}`}
    />
  );
}
