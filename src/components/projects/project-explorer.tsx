"use client";

import { animate, AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { ChevronDown, Code2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import type { Project } from "@/data/projects";
import { useEscapeKey, useScrollLock } from "@/lib/use-scroll-lock";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";
import { CodeBlock } from "@/components/ui/code-block";
import { ProjectVisual } from "./project-visual";
import { SandboxPreview } from "./sandbox-preview";
import type { MorphRect } from "@/lib/use-morph-rect";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];
const MATRIX_EASE = [0.87, 0, 0.13, 1] as [number, number, number, number];
const MORPH_DURATION = 0.62;

interface ProjectExplorerProps {
  project: Project | null;
  originRect: MorphRect | null;
  onClose: () => void;
  onExited?: () => void;
}

export function ProjectExplorer({
  project,
  originRect,
  onClose,
  onExited,
}: ProjectExplorerProps) {
  const open = project !== null;
  const mounted = useMounted();

  useScrollLock(open);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence onExitComplete={onExited}>
      {open && project ? (
        <MorphPanel
          key={project.id}
          project={project}
          rect={originRect}
          onClose={onClose}
        />
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function MorphPanel({
  project,
  rect,
  onClose,
}: {
  project: Project;
  rect: MorphRect | null;
  onClose: () => void;
}) {
  const [landed, setLanded] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [snippetId, setSnippetId] = useState(project.snippets[0]?.id ?? "");
  const scrollRef = useRef<HTMLDivElement>(null);

  const reduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const sourceRadius = rect ? parseFloat(rect.borderRadius) || 12 : 12;

  const source: MorphRect =
    rect ?? {
      left: window.innerWidth * 0.32,
      top: window.innerHeight * 0.4,
      width: Math.min(420, window.innerWidth * 0.42),
      height: 300,
      borderRadius: "12px",
    };

  const dragRaw = useMotionValue(0);
  const dragY = useSpring(dragRaw, { stiffness: 320, damping: 34 });
  const dragState = useRef<{ startY: number; active: boolean } | null>(null);

  useEscapeKey(true, () => {
    if (inspectorOpen) {
      setInspectorOpen(false);
    } else {
      onClose();
    }
  });

  useEffect(() => {
    if (!reduced) return;
    const frame = requestAnimationFrame(() => setLanded(true));
    return () => cancelAnimationFrame(frame);
  }, [reduced]);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button, a, input, textarea")) {
      return;
    }
    if ((scrollRef.current?.scrollTop ?? 0) > 2) return;
    dragState.current = { startY: event.clientY, active: false };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const state = dragState.current;
    if (!state) return;
    const dy = event.clientY - state.startY;
    if (!state.active) {
      if (dy < 12 || (scrollRef.current?.scrollTop ?? 0) > 0) return;
      state.active = true;
    }
    dragRaw.set(Math.min(380, dy * 0.55));
  }

  function handlePointerUp() {
    const state = dragState.current;
    dragState.current = null;
    if (!state?.active) return;
    const pulled = dragRaw.get();
    if (pulled > 130) {
      animate(dragRaw, pulled + 120, { duration: 0.22, ease: EASE });
      onClose();
    } else {
      animate(dragRaw, 0, { type: "spring", stiffness: 320, damping: 26 });
    }
  }

  const snippet =
    project.snippets.find((s) => s.id === snippetId) ?? project.snippets[0];

  return (
    <>
      <motion.div
        key="explorer-backdrop"
        className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: landed ? 1 : 0.6 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`${project.title} case study`}
        data-no-drag
        data-overlay
        className="fixed z-[61] overflow-hidden bg-surface"
        style={{ willChange: "left, top, width, height" }}
        initial={{
          left: source.left,
          top: source.top,
          width: source.width,
          height: source.height,
          borderRadius: sourceRadius,
        }}
        animate={{
          left: 0,
          top: 0,
          width: "100vw",
          height: "100vh",
          borderRadius: 0,
          transition: { duration: MORPH_DURATION, ease: MATRIX_EASE },
        }}
        exit={{
          left: source.left,
          top: source.top,
          width: source.width,
          height: source.height,
          borderRadius: sourceRadius,
          transition: {
            duration: reduced ? 0 : 0.58,
            ease: MATRIX_EASE,
          },
        }}
        onAnimationComplete={() => {
          requestAnimationFrame(() => setLanded(true));
        }}
      >
        <motion.div style={{ y: dragY }} className="absolute inset-0">
          <motion.div
            className="relative h-[44svh] min-h-[300px]"
            initial={false}
          >
            <ProjectVisual project={project} />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-surface to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0">
              <div className="shell pb-8">
                <p className="mb-2 font-mono text-micro text-dim">
                  {project.index} — {project.year} · {project.role}
                </p>
                <h2 className="font-display text-headline font-semibold uppercase tracking-tight text-foreground sm:text-display">
                  {project.title}
                </h2>
              </div>
            </div>
          </motion.div>

          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="Close case study"
            className="absolute right-5 top-5 z-20 flex size-11 items-center justify-center rounded-full border border-line bg-background/70 text-dim backdrop-blur-md transition-colors hover:border-accent-deep hover:text-accent"
          >
            <X size={17} />
          </button>

          <div
            ref={scrollRef}
            data-inner-scroll
            data-lenis-prevent
            className={cn(
              "h-full",
              landed
                ? "overflow-y-auto overscroll-contain"
                : "overflow-hidden",
            )}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {landed ? (
              <motion.div
                className="shell space-y-14 pb-40 pt-12"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <p className="max-w-2xl text-lede text-dim">{project.summary}</p>

                <section aria-label="Live sandbox" className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-mono text-micro text-faint">
                      Interactive sandbox
                    </h3>
                    <span className="font-mono text-micro text-faint">
                      {project.sandboxUrl ? "remote build" : "local glsl"}
                    </span>
                  </div>
                  <SandboxPreview project={project} />
                </section>

                <section aria-label="Key metrics" className="space-y-4">
                  <h3 className="font-mono text-micro text-faint">
                    Performance envelope
                  </h3>
                  <div className="grid grid-cols-3 divide-x divide-line rounded-xl border border-line">
                    {project.metrics.map((metric) => (
                      <div key={metric.label} className="px-5 py-6">
                        <p className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                          {metric.value}
                        </p>
                        <p className="mt-1.5 font-mono text-micro text-faint">
                          {metric.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section aria-label="Architecture breakdown" className="space-y-4">
                  <h3 className="font-mono text-micro text-faint">
                    Technical breakdown
                  </h3>
                  <ol className="grid gap-4 sm:grid-cols-2">
                    {project.architecture.map((line, i) => (
                      <li
                        key={i}
                        className="flex gap-4 rounded-xl border border-line bg-background/60 p-4"
                      >
                        <span className="pt-0.5 font-mono text-micro text-accent-deep">
                          0{i + 1}
                        </span>
                        <span className="text-fine leading-relaxed text-dim">
                          {line}
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>

                <ul className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-line px-3 py-1.5 font-mono text-micro text-dim"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ) : null}
          </div>

          <AnimatePresence>
            {landed && inspectorOpen && snippet ? (
              <motion.div
                key="inspector"
                data-overlay
                className="absolute inset-x-0 bottom-0 z-30 flex max-h-[58svh] flex-col rounded-t-2xl border-t border-line bg-background/95 backdrop-blur-xl"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <div className="flex items-center justify-between border-b border-line px-5 py-3">
                  <div className="flex gap-1">
                    {project.snippets.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSnippetId(s.id)}
                        className={cn(
                          "relative px-3 py-2 font-mono text-micro transition-colors",
                          s.id === snippet.id
                            ? "text-foreground"
                            : "text-faint hover:text-dim",
                        )}
                      >
                        {s.title}
                        {s.id === snippet.id ? (
                          <motion.span
                            layoutId="inspector-tab"
                            className="absolute inset-x-0 bottom-[-1px] h-px bg-accent"
                          />
                        ) : null}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setInspectorOpen(false)}
                    aria-label="Collapse code inspector"
                    className="flex size-8 items-center justify-center rounded-full border border-line text-dim transition-colors hover:border-accent-deep hover:text-accent"
                  >
                    <ChevronDown size={15} />
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  <CodeBlock snippet={snippet} lineNumbers />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {landed && !inspectorOpen ? (
            <motion.button
              type="button"
              onClick={() => setInspectorOpen(true)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="absolute bottom-5 right-5 z-20 flex items-center gap-2 rounded-full bg-accent px-5 py-3 font-mono text-micro text-background shadow-lg transition-colors hover:bg-accent-deep"
            >
              <Code2 size={14} />
              Inspect code
            </motion.button>
          ) : null}
        </motion.div>
      </motion.div>
    </>
  );
}
