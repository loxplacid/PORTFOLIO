/**
 * ============================================================================
 * PROJECT DATA MODEL — evidence-based, placeholder-aware.
 * ============================================================================
 *
 * SCHEMA CONTRACT
 * ---------------
 * Every project supports a full editorial case study (problem → context →
 * constraints → approach → architecture → implementation → outcome → lessons)
 * plus links and media with EXPLICIT status. Components render gracefully
 * around any absent field.
 *
 * METRICS ARE EVIDENCE-TYPED. A number without evidence must never appear
 * factual. Four kinds:
 *  - verified     measured & evidenced (`evidence` says how). Rendered as fact.
 *  - qualitative  true but non-numeric statement. Rendered as prose, no number.
 *  - unavailable  metric exists conceptually but was not measured. Renders "—".
 *  - private      known but not publishable. Renders "Private", never the value.
 *
 * HONESTY: every entry currently in this file is a clearly-flagged placeholder
 * (`placeholder: true`) written to exercise the schema. They describe project
 * *shapes*, not history: no clients, users, revenue, employers or awards are
 * implied. Replace entries with real work, set `placeholder: false`, and flip
 * SITE_MODE to "live" in src/data/site.ts.
 */

export const PROJECT_TAGS = [
  "Next.js",
  "AI Systems",
  "WebGL",
  "Motion",
  "Tooling",
] as const;

export type ProjectTag = (typeof PROJECT_TAGS)[number];

export type BentoSpan = "wide" | "standard";

/** Visual motif for procedural artwork. Artwork is decorative, never evidence. */
export type VisualVariant = "contours" | "beams" | "orbit" | "grid";

export type ProjectStatus =
  | "shipped"
  | "in-development"
  | "archived"
  | "concept";

export type ProjectCategory =
  | "product"
  | "open-source"
  | "client-work"
  | "experiment";

/* ------------------------------------------------------------------ */
/* Evidence-typed metrics                                              */
/* ------------------------------------------------------------------ */

export type ProjectMetric =
  | {
      kind: "verified";
      label: string;
      value: string;
      /** How the number was measured — required for verified claims. */
      evidence: string;
    }
  | {
      kind: "qualitative";
      label: string;
      /** True non-numeric outcome. Never formatted to look like a figure. */
      statement: string;
    }
  | {
      kind: "unavailable";
      label: string;
      /** Optional reason it is missing (e.g. "not yet instrumented"). */
      note?: string;
    }
  | {
      kind: "private";
      label: string;
      /** Optional scope hint that reveals nothing ("per client NDA"). */
      note?: string;
    };

/* ------------------------------------------------------------------ */
/* Links with explicit status                                          */
/* ------------------------------------------------------------------ */

import type { LinkStatus } from "./site";

export interface ProjectLink {
  url: string | null;
  status: LinkStatus;
}

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

export interface ProjectMedia {
  id: string;
  kind: "image" | "video" | "webgl-placeholder";
  /**
   * Asset path under /public (image/poster). null → component renders a
   * labelled placeholder frame instead of implying real media exists.
   */
  src: string | null;
  alt: string;
  caption?: string;
  poster?: string | null;
}

export interface ProjectSnippet {
  id: string;
  title: string;
  language: "ts" | "glsl";
  code: string;
}

/* ------------------------------------------------------------------ */
/* Case study                                                          */
/* ------------------------------------------------------------------ */

export interface ProjectCaseStudy {
  /** WHAT was wrong / missing. Required for a credible case study. */
  problem?: string;
  /** Surrounding situation: team, stage, prior art. Facts only. */
  context?: string;
  /** Hard limits the solution had to respect. */
  constraints?: string[];
  /** The strategy chosen and WHY. */
  approach?: string;
  /** Structural decisions, one line each. */
  architecture?: string[];
  /** Notable implementation details / war stories. */
  implementation?: string[];
  /** What actually happened after shipping. Must match metric evidence. */
  outcome?: string;
  /** What the author would do differently / learned. */
  lessons?: string[];
}

/* ------------------------------------------------------------------ */
/* Project                                                             */
/* ------------------------------------------------------------------ */

export interface Project {
  slug: string;
  index: string;
  title: string;
  shortDescription: string;
  detailedDescription?: string;
  role: string;
  year: string;
  status: ProjectStatus;
  category: ProjectCategory;
  tags: ProjectTag[];
  span: BentoSpan;
  variant: VisualVariant;
  hue: number;
  caseStudy: ProjectCaseStudy;
  metrics: ProjectMetric[];
  snippets: ProjectSnippet[];
  media: ProjectMedia[];
  demoUrl?: ProjectLink;
  repositoryUrl?: ProjectLink;
  featured: boolean;
  /**
   * true → entry exercises layout only and is disclosed as placeholder
   * content in the UI. Must be false for real work.
   */
  placeholder: boolean;
}

/* ------------------------------------------------------------------ */
/* Entries                                                             */
/* ------------------------------------------------------------------ */

const PLACEHOLDER_NOTE =
  "Placeholder entry — replace with a real project in src/data/projects.ts";

export const PROJECTS: Project[] = [
  {
    slug: "signal-atlas",
    index: "01",
    title: "Signal Atlas",
    shortDescription:
      "Placeholder slot for a large-scale data-visualisation build — a geospatial point cloud rendered in the browser.",
    role: "Design engineer",
    year: "2026",
    status: "concept",
    category: "experiment",
    tags: ["WebGL"],
    span: "wide",
    variant: "contours",
    hue: 200,
    placeholder: true,
    featured: true,
    caseStudy: {
      problem:
        "Reserved slot. Describe the concrete problem the real project solved — what was broken, slow or impossible before it existed.",
      context:
        "Reserved slot. Situate the work honestly: when, for whom (or independent), and what existed already.",
      constraints: [
        "Reserved slot — list the real budget, platform or performance limits.",
        "Reserved slot — list team-size or timeline limits.",
      ],
      approach:
        "Reserved slot. Explain the chosen strategy and why alternatives were rejected.",
      architecture: [
        "Reserved slot — structural decision #1.",
        "Reserved slot — structural decision #2.",
        "Reserved slot — structural decision #3.",
      ],
      outcome:
        "Reserved slot. Report what actually happened after shipping, consistent with the metric evidence below.",
      lessons: ["Reserved slot — one honest lesson per line."],
    },
    metrics: [
      { kind: "unavailable", label: "Frame rate", note: "Not yet instrumented" },
      { kind: "unavailable", label: "Data volume" },
      { kind: "unavailable", label: "Audience" },
    ],
    snippets: [
      {
        id: "flow",
        title: "flow-field.glsl",
        language: "glsl",
        code: `// Illustrative snippet attached to a placeholder entry.
vec3 flow(vec3 p, float seed) {
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
    media: [
      {
        id: "hero",
        kind: "webgl-placeholder",
        src: null,
        alt: "Decorative shader preview — placeholder artwork, not the project",
        caption: PLACEHOLDER_NOTE,
      },
    ],
    demoUrl: { url: null, status: "not-provided" },
    repositoryUrl: { url: null, status: "private" },
  },
  {
    slug: "ledgerline",
    index: "02",
    title: "Ledgerline",
    shortDescription:
      "Placeholder slot for a product engineering build — a transactional console with streaming updates.",
    role: "Lead engineer",
    year: "2025",
    status: "concept",
    category: "product",
    tags: ["Next.js"],
    span: "standard",
    variant: "grid",
    hue: 150,
    placeholder: true,
    featured: true,
    caseStudy: {
      problem:
        "Reserved slot. State the operational pain the real product removed.",
      approach:
        "Reserved slot. Data-flow strategy and why it fit the constraints.",
      architecture: [
        "Reserved slot — structural decision #1.",
        "Reserved slot — structural decision #2.",
      ],
      lessons: ["Reserved slot — one honest lesson per line."],
    },
    metrics: [
      { kind: "unavailable", label: "Reliability" },
      { kind: "private", label: "Volume", note: "Per client confidentiality" },
      { kind: "unavailable", label: "Latency" },
    ],
    snippets: [],
    media: [],
    demoUrl: { url: null, status: "private" },
    repositoryUrl: { url: null, status: "private" },
  },
  {
    slug: "morphogen",
    index: "03",
    title: "Morphogen",
    shortDescription:
      "Placeholder slot for a graphics research prototype — generative letterforms rendered as signed distance fields.",
    role: "Creative technologist",
    year: "2025",
    status: "concept",
    category: "experiment",
    tags: ["WebGL"],
    span: "standard",
    variant: "orbit",
    hue: 300,
    placeholder: true,
    featured: true,
    caseStudy: {
      problem: "Reserved slot.",
      approach: "Reserved slot.",
      lessons: ["Reserved slot."],
    },
    metrics: [{ kind: "unavailable", label: "Render cost" }],
    snippets: [],
    media: [],
    repositoryUrl: { url: null, status: "not-provided" },
  },
  {
    slug: "nightshift",
    index: "04",
    title: "Nightshift",
    shortDescription:
      "Placeholder slot for an on-device AI workspace — local inference with a privacy-first contract.",
    role: "Engineer",
    year: "2026",
    status: "concept",
    category: "experiment",
    tags: ["Next.js", "AI Systems"],
    span: "wide",
    variant: "beams",
    hue: 25,
    placeholder: true,
    featured: true,
    caseStudy: {
      problem: "Reserved slot.",
      constraints: ["Reserved slot — e.g. offline-only operation."],
      approach: "Reserved slot.",
      lessons: ["Reserved slot."],
    },
    metrics: [
      { kind: "qualitative", label: "Privacy", statement: "Designed to run fully on-device — no telemetry path shipped." },
      { kind: "unavailable", label: "Decode speed" },
    ],
    snippets: [
      {
        id: "loader",
        title: "model.worker.ts",
        language: "ts",
        code: `// Illustrative snippet attached to a placeholder entry.
self.onmessage = async (event: LoadMessage) => {
  const shards = await cache.openWeights(event.data.model);
  const session = await runtime.load(shards, {
    preferBackend: navigator.gpu ? "webgpu" : "wasm-simd",
  });
  self.postMessage({ type: "ready", backend: session.backend });
};`,
      },
    ],
    media: [],
    repositoryUrl: { url: null, status: "not-provided" },
  },
  {
    slug: "cadence",
    index: "05",
    title: "Cadence",
    shortDescription:
      "Placeholder slot for an open-source motion library — declarative timelines compiled to WAAPI.",
    role: "Author",
    year: "2024",
    status: "concept",
    category: "open-source",
    tags: ["Motion", "Tooling"],
    span: "wide",
    variant: "contours",
    hue: 82,
    placeholder: true,
    featured: true,
    caseStudy: {
      problem: "Reserved slot.",
      approach: "Reserved slot.",
      lessons: ["Reserved slot."],
    },
    metrics: [
      { kind: "unavailable", label: "Bundle size" },
      { kind: "verified", label: "Runtime dependencies", value: "0", evidence: "package.json dependency manifest" },
    ],
    snippets: [],
    media: [],
    repositoryUrl: { url: null, status: "not-provided" },
  },
  {
    slug: "fieldkit",
    index: "06",
    title: "Fieldkit",
    shortDescription:
      "Placeholder slot for developer tooling — shader debugging with live uniform inspection.",
    role: "Maintainer",
    year: "2024",
    status: "concept",
    category: "open-source",
    tags: ["Tooling", "WebGL"],
    span: "standard",
    variant: "grid",
    hue: 260,
    placeholder: true,
    featured: false,
    caseStudy: {
      problem: "Reserved slot.",
      lessons: ["Reserved slot."],
    },
    metrics: [{ kind: "unavailable", label: "Hot-swap latency" }],
    snippets: [],
    media: [],
    repositoryUrl: { url: null, status: "not-provided" },
  },
];

export function getProject(slugOrId: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slugOrId || p.index === slugOrId);
}

export function countByTag(tag: ProjectTag): number {
  return PROJECTS.filter((project) => project.tags.includes(tag)).length;
}
