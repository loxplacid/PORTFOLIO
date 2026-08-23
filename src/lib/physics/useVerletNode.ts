"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSharedEngine, VerletPoint } from "./verletEngine";

export interface UseVerletNodeOptions {
  x?: number;
  y?: number;
  mass?: number;
  friction?: number;
  gravity?: number;
}

export interface UseVerletNodeApi {
  point: VerletPoint;
  bind: (element: HTMLElement | null) => void;
  applyForce: (fx: number, fy: number) => void;
  attractTo: (x: number, y: number, stiffness?: number) => void;
  repelFrom: (x: number, y: number, radius: number, force: number) => void;
  setTarget: (x: number, y: number) => void;
  clearTarget: () => void;
}

export function useVerletNode(
  options: UseVerletNodeOptions = {},
): UseVerletNodeApi {
  const [point] = useState(
    () =>
      new VerletPoint({
        x: options.x,
        y: options.y,
        mass: options.mass,
        friction: options.friction,
        gravity: options.gravity,
      }),
  );

  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const engine = getSharedEngine();
    engine.add(point);
    return () => {
      engine.remove(point);
    };
  }, [point]);

  useEffect(() => {
    const write = () => {
      const el = elementRef.current;
      if (!el) return;
      el.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
    };
    write();
    return getSharedEngine().subscribe(write);
  }, [point]);

  const bind = useCallback((element: HTMLElement | null) => {
    elementRef.current = element;
  }, []);

  return useMemo(
    () => ({
      point,
      bind,
      applyForce: (fx: number, fy: number) => point.applyForce(fx, fy),
      attractTo: (x: number, y: number, stiffness?: number) =>
        point.attractTo(x, y, stiffness),
      repelFrom: (x: number, y: number, radius: number, force: number) =>
        point.repelFrom(x, y, radius, force),
      setTarget: (x: number, y: number) => point.setTarget(x, y),
      clearTarget: () => point.clearTarget(),
    }),
    [point, bind],
  );
}
