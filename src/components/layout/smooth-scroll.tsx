"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect, type ReactNode } from "react";

gsap.registerPlugin(ScrollTrigger);

let lenisRef: Lenis | null = null;
let scrollVelocity = 0;

export function readScrollVelocity(): number {
  return scrollVelocity;
}

export function scrollToTarget(selector: string): void {
  if (typeof window === "undefined") return;
  const el = document.querySelector(selector);
  if (!el) return;
  if (lenisRef) {
    lenisRef.scrollTo(el as HTMLElement, { duration: 1.2 });
  } else {
    (el as HTMLElement).scrollIntoView({ behavior: "smooth" });
  }
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: 0.08,
      duration: 1.2,
      smoothWheel: true,
      touchMultiplier: 1.4,
    });
    lenisRef = lenis;

    const onScroll = (instance: Lenis) => {
      scrollVelocity = instance.velocity;
      ScrollTrigger.update();
    };
    lenis.on("scroll", onScroll);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.off("scroll", onScroll);
      lenis.destroy();
      lenisRef = null;
      scrollVelocity = 0;
    };
  }, []);

  return <>{children}</>;
}
