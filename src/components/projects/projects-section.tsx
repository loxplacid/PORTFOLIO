"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  PROJECTS,
  PROJECT_TAGS,
  countByTag,
  getProject,
  type ProjectTag,
} from "@/data/projects";
import { audio } from "@/lib/audio-engine";
import { useUIStore } from "@/store/ui-store";
import { KineticText } from "@/components/motion/kinetic-text";
import { Reveal } from "@/components/motion/reveal";
import { ProjectExplorer } from "./project-explorer";
import { FloatingPreview } from "./floating-preview";
import type { MorphRect } from "@/lib/use-morph-rect";

gsap.registerPlugin(ScrollTrigger);

const SPRING = {
  type: "spring",
  stiffness: 300,
  damping: 28,
} as const;

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];
const ENTER_TRANSITION = { duration: 0.45, ease: EASE };
const EXIT_TRANSITION = { duration: 0.26, ease: EASE };

type Filter = "All" | ProjectTag;

export function ProjectsSection() {
  const [filter, setFilter] = useState<Filter>("All");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [originRect, setOriginRect] = useState<MorphRect | null>(null);
  const requestedProjectId = useUIStore((s) => s.requestedProjectId);
  const clearProjectRequest = useUIStore((s) => s.clearProjectRequest);
  const requestedTag = useUIStore((s) => s.requestedTag);
  const clearTagFilterRequest = useUIStore((s) => s.clearTagFilterRequest);
  const listRef = useRef<HTMLUListElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!requestedProjectId) return;
    const frame = requestAnimationFrame(() => {
      // Programmatic open — no trigger element, originRect stays null
      setActiveId(requestedProjectId);
      setPreviewId(requestedProjectId);
      setOriginRect(null);
      clearProjectRequest();
    });
    return () => cancelAnimationFrame(frame);
  }, [requestedProjectId, clearProjectRequest]);

  useEffect(() => {
    if (!requestedTag) return;
    const frame = requestAnimationFrame(() => {
      setFilter(requestedTag);
      clearTagFilterRequest();
    });
    return () => cancelAnimationFrame(frame);
  }, [requestedTag, clearTagFilterRequest]);

  // GSAP ScrollTrigger: stagger-reveal list rows on scroll
  useEffect(() => {
    const ctx = gsap.context(() => {
      const rows = listRef.current?.querySelectorAll<HTMLElement>("[data-row]");
      if (!rows?.length) return;

      gsap.fromTo(
        rows,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.07,
          scrollTrigger: {
            trigger: listRef.current,
            start: "top 82%",
            once: true,
          },
        },
      );
    });
    return () => ctx.revert();
  }, []);

  const filtered = useMemo(
    () =>
      filter === "All"
        ? PROJECTS
        : PROJECTS.filter((project) => project.tags.includes(filter)),
    [filter],
  );

  function handleOpen(id: string, triggerEl: HTMLElement) {
    // Capture exact rect before any state change repaints the DOM
    const r = triggerEl.getBoundingClientRect();
    const computed = window.getComputedStyle(triggerEl);
    setOriginRect({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
      borderRadius: computed.borderRadius,
    });
    setActiveId(id);
    setPreviewId(id);
  }

  function handleClose() {
    // originRect is kept until after the collapse animation finishes
    setActiveId(null);
    window.setTimeout(() => {
      setPreviewId(null);
      setOriginRect(null);
    }, 700);
  }

  return (
    <section id="work" aria-label="Selected work" className="h-full">
      <div
        data-inner-scroll
        data-lenis-prevent
        className="h-full overflow-y-auto overscroll-contain"
      >
        <LayoutGroup>
          <div className="shell py-16 sm:py-24">
            <Reveal>
              <div
                ref={headerRef}
                data-fluid-heading
                className="fluid-heading flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8"
              >
                <div>
                  <p className="mb-5 font-mono text-micro text-faint">
                    Selected work — 02
                  </p>
                  <h2 className="font-display font-semibold uppercase">
                    <KineticText text="Selected" className="block text-display" />
                    <KineticText text="Work" className="block text-display text-hollow" />
                  </h2>
                </div>
                <p className="max-w-xs pb-1 text-right font-mono text-micro text-faint">
                  Six builds, one obsession — interfaces that hold up under
                  load.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div
                role="group"
                aria-label="Filter projects by tag"
                className="flex flex-wrap items-center gap-2 py-8"
              >
                <FilterChip
                  label="All"
                  count={PROJECTS.length}
                  active={filter === "All"}
                  onSelect={() => {
                    if (filter === "All") return;
                    audio.snap();
                    setFilter("All");
                  }}
                />
                {PROJECT_TAGS.map((tag) => (
                  <FilterChip
                    key={tag}
                    label={tag}
                    count={countByTag(tag)}
                    active={filter === tag}
                    onSelect={() => {
                      if (filter === tag) return;
                      audio.snap();
                      setFilter(tag);
                    }}
                  />
                ))}
              </div>
            </Reveal>

            <motion.ul
              ref={listRef}
              layout
              transition={SPRING}
              className={`transition-opacity duration-300 ${
                activeId ? "opacity-30" : "opacity-100"
              }`}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {filtered.map((project) => (
                  <motion.li
                    layout
                    key={project.id}
                    data-row
                    initial={{ opacity: 0, y: 26 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: ENTER_TRANSITION,
                    }}
                    exit={{
                      opacity: 0,
                      y: -14,
                      transition: EXIT_TRANSITION,
                    }}
                    onMouseEnter={() => setPreviewId(project.id)}
                    onMouseLeave={() =>
                      setPreviewId((cur) =>
                        cur === project.id && activeId !== project.id
                          ? null
                          : cur,
                      )
                    }
                  >
                    <button
                      type="button"
                      onClick={(e) => handleOpen(project.id, e.currentTarget)}
                      aria-haspopup="dialog"
                      data-sound
                      className="group relative w-full border-t border-line py-6 text-left sm:py-8"
                    >
                      {/* Hover fill bar */}
                      <motion.span
                        aria-hidden
                        className="absolute inset-0 origin-left bg-surface/60"
                        initial={{ scaleX: 0 }}
                        whileHover={{ scaleX: 1 }}
                        transition={{ duration: 0.4, ease: EASE }}
                      />

                      <span className="relative grid grid-cols-[auto_1fr_auto] items-center gap-x-5 sm:gap-x-10">
                        {/* Index */}
                        <span className="font-mono text-micro tabular-nums text-faint transition-colors group-hover:text-accent">
                          {project.index}
                        </span>

                        {/* Title + tags row */}
                        <span className="flex flex-col gap-1.5">
                          <KineticText
                            text={project.title}
                            className="font-display text-title font-semibold tracking-tight text-foreground md:text-headline"
                          />
                          {/* Tag pills — visible on mobile too */}
                          <span className="flex flex-wrap gap-1.5 md:hidden">
                            {project.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full border border-line px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-widest text-faint"
                              >
                                {tag}
                              </span>
                            ))}
                          </span>
                        </span>

                        {/* Meta + arrow */}
                        <span className="flex items-center gap-4 sm:gap-6">
                          <span className="hidden flex-col items-end gap-1.5 md:flex">
                            <span className="font-mono text-micro text-dim">
                              {project.year} — {project.role}
                            </span>
                            <span className="flex gap-1.5">
                              {project.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full border border-line px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-widest text-faint transition-colors group-hover:border-accent-deep/40 group-hover:text-dim"
                                >
                                  {tag}
                                </span>
                              ))}
                            </span>
                          </span>
                          <span className="flex size-9 items-center justify-center rounded-full border border-line opacity-60 transition-all duration-300 group-hover:border-accent-deep group-hover:opacity-100">
                            <ArrowUpRight
                              size={15}
                              className="text-accent transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                            />
                          </span>
                        </span>
                      </span>
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
              <li aria-hidden className="border-t border-line" />
            </motion.ul>

            <p
              className="mt-8 font-mono text-micro text-faint"
              aria-live="polite"
            >
              {String(filtered.length).padStart(2, "0")} /{" "}
              {String(PROJECTS.length).padStart(2, "0")}
              {filter === "All" ? " — full index" : ` — filtered by ${filter}`}
            </p>
          </div>

          <FloatingPreview projectId={previewId} />
          <ProjectExplorer
            project={activeId ? getProject(activeId) ?? null : null}
            originRect={originRect}
            onClose={handleClose}
          />
        </LayoutGroup>
      </div>
    </section>
  );
}

interface FilterChipProps {
  label: string;
  count: number;
  active: boolean;
  onSelect: () => void;
}

function FilterChip({ label, count, active, onSelect }: FilterChipProps) {
  return (
    <motion.button
      layout
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      transition={SPRING}
      className="relative rounded-full px-4 py-2 font-mono text-micro"
    >
      {active ? (
        <motion.span
          layoutId="activeFilter"
          className="absolute inset-0 rounded-full bg-accent"
          transition={SPRING}
        />
      ) : (
        <span className="absolute inset-0 rounded-full border border-line bg-surface/60" />
      )}
      <span
        className={`relative z-10 transition-colors duration-300 ${
          active ? "text-background" : "text-dim hover:text-foreground"
        }`}
      >
        {label}
        <span className={active ? "text-background/60" : "text-faint"}>
          {" "}
          {String(count).padStart(2, "0")}
        </span>
      </span>
    </motion.button>
  );
}
