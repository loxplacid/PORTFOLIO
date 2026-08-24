import type { ToWorkerMsg, FromWorkerMsg } from "@/workers/hero-gl.protocol";
import type { GpuTier } from "./use-gpu-tier";

type FpsListener   = (fps: number) => void;
type VramListener  = (mb: number) => void;
type RaycastListener = (hit: boolean, objectId: string | null) => void;

class HeroWorkerBridge {
  private worker: Worker | null = null;
  private fpsListeners   = new Set<FpsListener>();
  private vramListeners  = new Set<VramListener>();
  private raycastListeners = new Set<RaycastListener>();
  private readyListeners = new Set<() => void>();
  private pointerLastX = 0;
  private pointerLastY = 0;
  private pointerLastT = 0;
  private scrollVelocity = 0;
  private scrollDecayId = 0;
  private resizeObserver: ResizeObserver | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private initialized = false;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  init(canvas: HTMLCanvasElement, tier: GpuTier): Promise<void> {
    if (this.initialized) return Promise.resolve();
    this.initialized = true;
    this.canvas = canvas;

    return new Promise((resolve, reject) => {
      this.worker = new Worker(
        new URL("../workers/hero-gl.worker.ts", import.meta.url),
        { type: "module" },
      );

      // Worker construction or script-level errors must reject so the
      // caller can fall back — otherwise the canvas stays blank forever.
      this.worker.onerror = (event) => {
        reject(event.error ?? new Error("hero GL worker failed to load"));
      };

      this.worker.onmessage = (e: MessageEvent<FromWorkerMsg>) => {
        const msg = e.data;
        switch (msg.type) {
          case "ready":
            this.readyListeners.forEach((fn) => fn());
            resolve();
            break;
          case "fps":
            this.fpsListeners.forEach((fn) => fn(msg.value));
            break;
          case "vram":
            this.vramListeners.forEach((fn) => fn(msg.mb));
            break;
          case "raycast-result":
            this.raycastListeners.forEach((fn) => fn(msg.hit, msg.objectId));
            break;
        }
      };

      const offscreen = canvas.transferControlToOffscreen();
      const dpr = Math.min(window.devicePixelRatio || 1, tier === "low" ? 1.4 : 2);

      this.send(
        { type: "init", canvas: offscreen, width: canvas.clientWidth, height: canvas.clientHeight, dpr, tier },
        [offscreen],
      );

      this.bindResize(canvas);
      this.bindPointer();
    });
  }

  destroy() {
    this.worker?.terminate();
    this.worker = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    cancelAnimationFrame(this.scrollDecayId);
    window.removeEventListener("pointermove", this.onPointerMove);
    this.initialized = false;
  }

  // ── Commands ───────────────────────────────────────────────────────────────

  pause()  { this.send({ type: "pause" }); }
  resume() { this.send({ type: "resume" }); }

  notifySection(index: number) {
    this.send({ type: "section", index });
  }

  raycast(x: number, y: number) {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.send({ type: "raycast", x: x - rect.left, y: y - rect.top });
  }

  feedScrollVelocity(velocity: number) {
    this.scrollVelocity = velocity;
    this.send({ type: "scroll-velocity", velocity });
    cancelAnimationFrame(this.scrollDecayId);
    this.decayScroll();
  }

  // ── Listeners ──────────────────────────────────────────────────────────────

  onFps(fn: FpsListener)       { this.fpsListeners.add(fn);    return () => this.fpsListeners.delete(fn); }
  onVram(fn: VramListener)     { this.vramListeners.add(fn);   return () => this.vramListeners.delete(fn); }
  onRaycast(fn: RaycastListener) { this.raycastListeners.add(fn); return () => this.raycastListeners.delete(fn); }
  onReady(fn: () => void)      { this.readyListeners.add(fn);  return () => this.readyListeners.delete(fn); }

  // ── Private ────────────────────────────────────────────────────────────────

  private send(msg: ToWorkerMsg, transfer?: Transferable[]) {
    if (!this.worker) return;
    if (transfer?.length) {
      this.worker.postMessage(msg, transfer);
    } else {
      this.worker.postMessage(msg);
    }
  }

  private bindResize(canvas: HTMLCanvasElement) {
    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.send({ type: "resize", width, height, dpr });
    });
    this.resizeObserver.observe(canvas);
  }

  private onPointerMove = (e: PointerEvent) => {
    const now = e.timeStamp;
    const dtms = this.pointerLastT ? now - this.pointerLastT : 16.7;
    if (dtms <= 0) return;
    const vx = ((e.clientX - this.pointerLastX) / dtms) * 16.7;
    const vy = ((e.clientY - this.pointerLastY) / dtms) * 16.7;
    this.pointerLastX = e.clientX;
    this.pointerLastY = e.clientY;
    this.pointerLastT = now;
    this.send({ type: "pointer", x: e.clientX, y: e.clientY, vx, vy });
  };

  private bindPointer() {
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
  }

  private decayScroll = () => {
    this.scrollVelocity *= 0.88;
    if (Math.abs(this.scrollVelocity) > 0.5) {
      this.send({ type: "scroll-velocity", velocity: this.scrollVelocity });
      this.scrollDecayId = requestAnimationFrame(this.decayScroll);
    }
  };
}

// Singleton — one bridge per page
export const heroWorkerBridge = new HeroWorkerBridge();
