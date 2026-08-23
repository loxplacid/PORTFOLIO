import type { ReactNode } from "react";
import { KineticText } from "@/components/motion/kinetic-text";

export interface ArchiveEntry {
  year: string;
  title: string;
  kind: string;
  tag: string;
}

export const ARCHIVE_ENTRIES: ArchiveEntry[] = [
  { year: "2025", title: "Signal Atlas — tile streaming rewrite", kind: "Prototype", tag: "WebGL" },
  { year: "2025", title: "Cadence — spring solver v2", kind: "Library release", tag: "Motion" },
  { year: "2024", title: "Morphogen — SDF glyph sketches", kind: "Experiment", tag: "AI Systems" },
  { year: "2024", title: "Ledgerline — CDC event bus spike", kind: "Internal tool", tag: "Next.js" },
  { year: "2024", title: "Fieldkit — WGSL source maps", kind: "Open source", tag: "Tooling" },
  { year: "2023", title: "Nightshift — first quantized demo", kind: "Prototype", tag: "AI Systems" },
  { year: "2023", title: "Type in space — variable axis study", kind: "Talk + demos", tag: "Motion" },
  { year: "2022", title: "Cursor physics — early magnetic UI", kind: "Experiment", tag: "Interaction" },
];

export function ArchiveSection() {
  return (
    <div className="flex h-[100svh] flex-col justify-center py-16">
      <div className="shell">
        <p className="mb-5 font-mono text-micro text-faint">Archive — 03</p>
        <h2 data-fluid-heading className="fluid-heading font-display text-headline font-semibold uppercase tracking-tight">
          <KineticText text="Experiments " />
          <KineticText text="&" className="text-hollow" />
          <KineticText text=" artifacts" />
        </h2>

        <ul className="mt-10 border-t border-line">
          {ARCHIVE_ENTRIES.map((entry) => (
            <li
              key={entry.title}
              className="group grid grid-cols-[4.5rem_1fr_auto] items-baseline gap-4 border-b border-line py-3.5 transition-colors duration-300 hover:bg-surface/70 sm:grid-cols-[5rem_1fr_10rem_auto]"
            >
              <span className="font-mono text-micro tabular-nums text-faint">
                {entry.year}
              </span>
              <span className="truncate text-body text-dim transition-colors group-hover:text-foreground">
                {entry.title}
              </span>
              <span className="hidden font-mono text-micro text-faint sm:block">
                {entry.kind}
              </span>
              <span className="rounded-full border border-line px-2.5 py-0.5 text-right font-mono text-micro text-faint">
                {entry.tag}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface Fact {
  label: string;
  children: ReactNode;
}

const FACTS: Fact[] = [
  {
    label: "Practice",
    children: (
      <>
        Design engineering for product teams that care about feel — design
        systems, motion, WebGL and the plumbing underneath.
      </>
    ),
  },
  {
    label: "Stack",
    children: <>TypeScript · React · Three.js · GLSL · Node · Rust when it earns its keep.</>,
  },
  {
    label: "Principles",
    children: (
      <>Measure before animating. Ship accessible by default. Delete more than you add.</>
    ),
  },
];

export function AboutSection() {
  return (
    <div className="flex h-[100svh] flex-col justify-center py-16">
      <div className="shell">
        <p className="mb-5 font-mono text-micro text-faint">About — 04</p>
        <h2 data-fluid-heading className="fluid-heading max-w-4xl font-display text-display font-semibold tracking-tight">
          <KineticText text="Interfaces are " />
          <KineticText text="systems" className="text-hollow" />
          <KineticText text=", not screens." />
        </h2>

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
          {FACTS.map((fact) => (
            <div key={fact.label} className="bg-surface p-6">
              <p className="font-mono text-micro text-accent">{fact.label}</p>
              <p className="mt-3 text-fine leading-relaxed text-dim">
                {fact.children}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
