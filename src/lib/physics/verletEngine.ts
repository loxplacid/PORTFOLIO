"use client";

export interface VerletPointOptions {
  x?: number;
  y?: number;
  mass?: number;
  friction?: number;
  gravity?: number;
}

export class VerletPoint {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  vx = 0;
  vy = 0;
  mass: number;
  friction: number;
  gravity: number;

  private ax = 0;
  private ay = 0;
  private hasTarget = false;
  private targetX = 0;
  private targetY = 0;
  private stiffness = 0.06;

  constructor(options: VerletPointOptions = {}) {
    this.x = options.x ?? 0;
    this.y = options.y ?? 0;
    this.oldX = this.x;
    this.oldY = this.y;
    this.mass = Math.max(0.0001, options.mass ?? 1);
    this.friction = options.friction ?? 0.92;
    this.gravity = options.gravity ?? 0;
  }

  setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
    this.hasTarget = true;
  }

  clearTarget(): void {
    this.hasTarget = false;
  }

  attractTo(
    targetX: number,
    targetY: number,
    stiffness: number = this.stiffness,
  ): void {
    this.stiffness = stiffness;
    this.setTarget(targetX, targetY);
  }

  applyForce(fx: number, fy: number): void {
    this.ax += fx / this.mass;
    this.ay += fy / this.mass;
  }

  repelFrom(
    mouseX: number,
    mouseY: number,
    radius: number,
    force: number,
  ): void {
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const dist = Math.hypot(dx, dy);
    if (dist > radius || dist === 0) return;

    const falloff = 1 - dist / radius;
    const push = (force * falloff) / this.mass;
    this.vx += (dx / dist) * push;
    this.vy += (dy / dist) * push;
    this.oldX = this.x - this.vx;
    this.oldY = this.y - this.vy;
  }

  update(dt: number): void {
    if (this.hasTarget) {
      this.ax += (this.targetX - this.x) * this.stiffness * 60;
      this.ay += (this.targetY - this.y) * this.stiffness * 60;
    }
    this.ay += this.gravity;

    const velX = (this.x - this.oldX) * this.friction;
    const velY = (this.y - this.oldY) * this.friction;

    const nextX = this.x + velX + this.ax * dt * dt;
    const nextY = this.y + velY + this.ay * dt * dt;

    this.oldX = this.x;
    this.oldY = this.y;
    this.x = nextX;
    this.y = nextY;

    this.vx = this.x - this.oldX;
    this.vy = this.y - this.oldY;

    this.ax = 0;
    this.ay = 0;
  }
}

export class VerletEngine {
  private points = new Set<VerletPoint>();
  private subscribers = new Set<() => void>();
  private rafId = 0;
  private lastTime = 0;

  add(point: VerletPoint): void {
    this.points.add(point);
    this.ensureRunning();
  }

  remove(point: VerletPoint): void {
    this.points.delete(point);
    this.stopIfIdle();
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    this.ensureRunning();
    return () => {
      this.subscribers.delete(callback);
      this.stopIfIdle();
    };
  }

  private ensureRunning(): void {
    if (this.rafId) return;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  private stopIfIdle(): void {
    if (this.points.size || this.subscribers.size) return;
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  private loop = (timestamp: number): void => {
    const dt = Math.min(Math.max((timestamp - this.lastTime) / 1000, 1 / 240), 1 / 30);
    this.lastTime = timestamp;

    this.points.forEach((point) => point.update(dt));
    this.subscribers.forEach((callback) => callback());

    this.rafId = requestAnimationFrame(this.loop);
  };
}

let sharedEngine: VerletEngine | null = null;

export function getSharedEngine(): VerletEngine {
  if (!sharedEngine) sharedEngine = new VerletEngine();
  return sharedEngine;
}
