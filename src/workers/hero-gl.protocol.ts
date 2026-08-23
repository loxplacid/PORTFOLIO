// ─── Main → Worker ───────────────────────────────────────────────────────────

export type ToWorkerMsg =
  | { type: "init"; canvas: OffscreenCanvas; width: number; height: number; dpr: number; tier: "high" | "low" }
  | { type: "resize"; width: number; height: number; dpr: number }
  | { type: "pointer"; x: number; y: number; vx: number; vy: number }
  | { type: "scroll-velocity"; velocity: number }
  | { type: "section"; index: number }
  | { type: "raycast"; x: number; y: number }
  | { type: "pause" }
  | { type: "resume" };

// ─── Worker → Main ───────────────────────────────────────────────────────────

export type FromWorkerMsg =
  | { type: "ready" }
  | { type: "fps"; value: number }
  | { type: "raycast-result"; hit: boolean; objectId: string | null }
  | { type: "vram"; mb: number };
