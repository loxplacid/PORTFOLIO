export const PROJECT_TAGS = [
  "Next.js",
  "AI Systems",
  "WebGL",
  "Motion",
  "Tooling",
] as const;

export type ProjectTag = (typeof PROJECT_TAGS)[number];

export type BentoSpan = "wide" | "standard";

export type VisualVariant = "contours" | "beams" | "orbit" | "grid";

export interface ProjectMetric {
  value: string;
  label: string;
}

export interface ProjectSnippet {
  id: string;
  title: string;
  language: "ts" | "glsl";
  code: string;
}

export interface Project {
  id: string;
  index: string;
  title: string;
  summary: string;
  role: string;
  year: string;
  tags: ProjectTag[];
  span: BentoSpan;
  variant: VisualVariant;
  hue: number;
  sandboxUrl?: string;
  metrics: ProjectMetric[];
  architecture: string[];
  snippets: ProjectSnippet[];
}

export const PROJECTS: Project[] = [
  {
    id: "signal-atlas",
    index: "01",
    title: "Signal Atlas",
    summary:
      "A geospatial listening room — one and a half million radio signals rendered as a breathing point cloud you can fly through.",
    role: "Design engineer",
    year: "2026",
    tags: ["WebGL", "AI Systems"],
    span: "wide",
    variant: "contours",
    hue: 200,
    metrics: [
      { value: "60fps", label: "Sustained" },
      { value: "1.2M", label: "Live points" },
      { value: "9.4ms", label: "GPU frame" },
    ],
    architecture: [
      "Instanced point cloud streamed to the browser in binary tiles",
      "Curl-noise displacement evaluated entirely in a vertex shader",
      "Web Worker pool decodes tiles off the main thread",
      "Quadtree LOD culls roughly 92% of points per frame",
    ],
    snippets: [
      {
        id: "flow",
        title: "flow-field.glsl",
        language: "glsl",
        code: `vec3 flow(vec3 p, float seed) {
  vec3 q = p * uFrequency + vec3(0.0, uTime * 0.08, 0.0);
  float e = 0.35 * seed;
  return vec3(
    snoise(q + vec3(e, 0.0, 0.0)),
    snoise(q + vec3(0.0, e, 0.0)),
    snoise(q + vec3(0.0, 0.0, e))
  );
}`,
      },
    ],
  },
  {
    id: "ledgerline",
    index: "02",
    title: "Ledgerline",
    summary:
      "A real-time reconciliation console for double-entry ledgers, built on streaming server components and optimistic mutations.",
    role: "Lead engineer",
    year: "2025",
    tags: ["Next.js"],
    span: "standard",
    variant: "grid",
    hue: 150,
    metrics: [
      { value: "99.98%", label: "Uptime" },
      { value: "118ms", label: "p95 mutation" },
      { value: "14k", label: "Entries / day" },
    ],
    architecture: [
      "Postgres CDC feeds an append-only event bus",
      "React Server Components stream balance snapshots",
      "Server Actions apply optimistic ledger deltas with row-level locks",
      "Edge-cached FX tables keep conversion math off the hot path",
    ],
    snippets: [
      {
        id: "reconcile",
        title: "actions.ts",
        language: "ts",
        code: `"use server";

export async function reconcile(entry: EntryInput) {
  const ledger = await db.ledgers.lock(entry.accountId);
  const delta = computeDelta(ledger, entry);
  await append(ledger, delta);
  revalidateTag("ledger-" + entry.accountId);
  return delta;
}`,
      },
    ],
  },
  {
    id: "morphogen",
    index: "03",
    title: "Morphogen",
    summary:
      "A generative typography engine that grows letterforms from latent seeds and sculpts them as signed distance fields on the GPU.",
    role: "Creative technologist",
    year: "2025",
    tags: ["AI Systems", "WebGL"],
    span: "standard",
    variant: "orbit",
    hue: 300,
    metrics: [
      { value: "0.8s", label: "Cold start" },
      { value: "4", label: "Diffusion steps" },
      { value: "12", label: "Variable axes" },
    ],
    architecture: [
      "Latent seed decoded into a parametric glyph skeleton",
      "SDF field ray-marched in a single full-screen pass",
      "On-device ONNX inference proposes skeleton weights",
      "Variable-font axes interpolated for print-safe fallbacks",
    ],
    snippets: [
      {
        id: "axes",
        title: "interpolate.ts",
        language: "ts",
        code: `export function interpolateAxes(
  seed: LatentSeed,
  axes: readonly Axis[],
): AxisValues {
  const proposal = model.run(seed.vector);
  return axes.map((axis) => ({
    tag: axis.tag,
    value: clamp(axis.min, axis.max, proposal[axis.tag]),
  }));
}`,
      },
    ],
  },
  {
    id: "nightshift",
    index: "04",
    title: "Nightshift",
    summary:
      "A fully local AI workspace — quantized models, WebGPU inference and streaming UI that never phones home after first load.",
    role: "Founding engineer",
    year: "2026",
    tags: ["Next.js", "AI Systems"],
    span: "wide",
    variant: "beams",
    hue: 25,
    metrics: [
      { value: "100%", label: "On-device" },
      { value: "31 tok/s", label: "Decode speed" },
      { value: "0", label: "Network calls" },
    ],
    architecture: [
      "WASM SIMD runtime executes 4-bit quantized models",
      "WebGPU compute graph takes over where available",
      "Service worker caches weight shards across sessions",
      "Streaming partial hydration keeps typing latency under 16ms",
    ],
    snippets: [
      {
        id: "loader",
        title: "model.worker.ts",
        language: "ts",
        code: `self.onmessage = async (event: LoadMessage) => {
  const shards = await cache.openWeights(event.data.model);
  const session = await runtime.load(shards, {
    preferBackend: navigator.gpu ? "webgpu" : "wasm-simd",
  });
  self.postMessage({ type: "ready", backend: session.backend });
};`,
      },
    ],
  },
  {
    id: "cadence",
    index: "05",
    title: "Cadence",
    summary:
      "A dependency-free motion library that compiles declarative timelines into WAAPI and resolves interrupts with real springs.",
    role: "Author",
    year: "2024",
    tags: ["Motion", "Tooling"],
    span: "wide",
    variant: "contours",
    hue: 82,
    metrics: [
      { value: "2.1kB", label: "Gzipped" },
      { value: "0", label: "Dependencies" },
      { value: "38", label: "Primitives" },
    ],
    architecture: [
      "Timelines compile once to native WAAPI keyframes",
      "Interruptible spring solver rebases velocity mid-flight",
      "Reduced-motion queries pass through to static states",
      "Scheduling stays outside React render for zero re-renders",
    ],
    snippets: [
      {
        id: "spring",
        title: "spring.ts",
        language: "ts",
        code: `export function stepSpring(s: SpringState, dt: number): number {
  const force = -s.stiffness * (s.value - s.target);
  const damping = -s.damping * s.velocity;
  s.velocity += ((force + damping) / s.mass) * dt;
  s.value += s.velocity * dt;
  return s.value;
}`,
      },
    ],
  },
  {
    id: "fieldkit",
    index: "06",
    title: "Fieldkit",
    summary:
      "A shader debugging toolkit with live uniform graphing, GPU frame capture-replay and readable stack traces for WGSL and GLSL.",
    role: "Maintainer",
    year: "2024",
    tags: ["Tooling", "WebGL"],
    span: "standard",
    variant: "grid",
    hue: 260,
    metrics: [
      { value: "40ms", label: "Hot swap" },
      { value: "17", label: "Live uniforms" },
      { value: "3", label: "Backends" },
    ],
    architecture: [
      "Uniform graph diffing patches buffers without pipeline rebuilds",
      "Capture-replay restores exact GPU frame state",
      "Per-material error boundaries isolate shader crashes",
      "Source maps translate WGSL and GLSL back to TypeScript",
    ],
    snippets: [
      {
        id: "diff",
        title: "uniforms.ts",
        language: "ts",
        code: `export function diffUniforms(
  prev: UniformMap,
  next: UniformMap,
): Patch[] {
  return [...next].flatMap(([name, value]) =>
    equals(prev.get(name), value)
      ? []
      : [{ name, value, op: "set" }],
  );
}`,
      },
    ],
  },
];

export function getProject(id: string): Project | undefined {
  return PROJECTS.find((project) => project.id === id);
}

export function countByTag(tag: ProjectTag): number {
  return PROJECTS.filter((project) => project.tags.includes(tag)).length;
}
