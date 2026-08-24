"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef } from "react";
import { getProject } from "@/data/projects";
import {
  EASE_EXPO as EASE,
  SPRING_FOLLOW,
  SPRING_LAYOUT,
} from "@/lib/motion-tokens";
import { ProjectVisual } from "./project-visual";

const CARD_W = 336;
const CARD_H = 252; // 4:3

export function FloatingPreview({ projectId }: { projectId: string | null }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, SPRING_FOLLOW);
  const springY = useSpring(y, SPRING_FOLLOW);
  const rotate = useMotionValue(0);
  const springRotate = useSpring(rotate, SPRING_FOLLOW);

  // Tilt: raw pointer offset relative to card center
  const rawTiltX = useMotionValue(0);
  const rawTiltY = useMotionValue(0);
  const tiltX = useSpring(rawTiltX, SPRING_LAYOUT);
  const tiltY = useSpring(rawTiltY, SPRING_LAYOUT);

  // Map tilt values to rotateX/rotateY degrees
  const rotateX = useTransform(tiltY, [-1, 1], [12, -12]);
  const rotateY = useTransform(tiltX, [-1, 1], [-12, 12]);

  const sheenBackground = useTransform(
    [tiltX, tiltY],
    ([tx, ty]: number[]) =>
      `radial-gradient(ellipse 60% 50% at ${50 + tx * 30}% ${50 + ty * 30}%, rgba(255,255,255,0.07) 0%, transparent 70%)`,
  );

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      rotate.set(Math.max(-6, Math.min(6, (e.movementX || 0) * 0.3)));

      // Compute tilt relative to card center
      const cx = e.clientX + CARD_W / 2 + 48; // offset matches ml-12
      const cy = e.clientY - CARD_H / 2;
      const cardCX = cx + CARD_W / 2;
      const cardCY = cy + CARD_H / 2;
      rawTiltX.set(Math.max(-1, Math.min(1, (e.clientX - cardCX) / (CARD_W / 2))));
      rawTiltY.set(Math.max(-1, Math.min(1, (e.clientY - cardCY) / (CARD_H / 2))));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y, rotate, rawTiltX, rawTiltY]);

  // Reset tilt on leave
  useEffect(() => {
    if (!projectId) {
      rawTiltX.set(0);
      rawTiltY.set(0);
    }
  }, [projectId, rawTiltX, rawTiltY]);

  const project = projectId ? getProject(projectId) : undefined;

  return (
    <AnimatePresence>
      {project ? (
        <motion.div
          key="floating-preview"
          className="gpu-layer pointer-events-none fixed left-0 top-0 z-[45] hidden lg:block"
          initial={{ opacity: 0, scale: 0.82 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.28, ease: EASE }}
        >
          <motion.div
            style={{ x: springX, y: springY, rotate: springRotate }}
            className="gpu-layer will-change-transform"
          >
            <div className="ml-12 -translate-y-1/2" style={{ perspective: 800 }}>
              <motion.div
                ref={cardRef}
                layoutId={`project-cover-${project.slug}`}
                className="w-[21rem] overflow-hidden border border-line shadow-2xl shadow-black/60"
                style={{
                  borderRadius: "0.75rem",
                  rotateX,
                  rotateY,
                  transformStyle: "preserve-3d",
                }}
                transition={{ type: "spring", stiffness: 210, damping: 28 }}
              >
                <div className="relative aspect-[4/3]">
                  <ProjectVisual project={project} />

                  {/* Specular sheen that tracks tilt */}
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-[0.75rem]"
                    style={{ background: sheenBackground }}
                  />

                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-4 py-2.5">
                    <span className="font-mono text-micro text-dim">
                      {project.year}
                    </span>
                    <span className="flex items-center gap-2">
                      {project.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-line/60 bg-background/50 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-widest text-faint backdrop-blur-sm"
                        >
                          {tag}
                        </span>
                      ))}
                      <span
                        aria-hidden
                        className="size-1.5 rounded-full bg-accent animate-pulse-dot"
                      />
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
