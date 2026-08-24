"use client";

import { ArrowUpRight } from "lucide-react";
import { Eyebrow } from "@/components/ui/primitives";
import { KineticText } from "@/components/motion/kinetic-text";
import { StatusPill } from "@/components/ui/status-pill";
import { scrollToTarget } from "@/components/layout/smooth-scroll";
import {
  ARCHIVE_ENTRIES,
  sortedArchive,
  type ArchiveEntry,
} from "@/data/archive";
import { CONTACT, END_STATEMENT, IDENTITY_DISPLAY } from "@/data/site";

const TYPE_LABEL: Record<ArchiveEntry["type"], string> = {
  project: "Project",
  experiment: "Experiment",
  article: "Article",
  note: "Note",
  learning: "Learning",
  milestone: "Milestone",
  prototype: "Prototype",
};

function formatDate(iso: string): string {
  const [year, month] = iso.split("-");
  return `${year} · ${month}`;
}

function EntryRow({ entry }: { entry: ArchiveEntry }) {
  return (
    <li className="group grid grid-cols-[5.5rem_1fr_auto] items-baseline gap-4 border-b border-line py-3.5 transition-colors duration-300 hover:bg-surface/70 sm:grid-cols-[6rem_1fr_10rem_auto]">
      <span className="font-mono text-micro tabular-nums text-faint">
        {formatDate(entry.date)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-body text-dim transition-colors group-hover:text-foreground">
          {entry.title}
        </span>
        {entry.description ? (
          <span className="mt-0.5 block truncate text-fine text-faint">
            {entry.description}
          </span>
        ) : null}
      </span>
      <span className="hidden font-mono text-micro text-faint sm:block">
        {TYPE_LABEL[entry.type]}
      </span>
      <span className="rounded-full border border-line px-2.5 py-0.5 text-right font-mono text-micro text-faint">
        {entry.projectSlug ?? "—"}
      </span>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-start gap-4 border-b border-line py-14">
      <p className="font-display text-title font-semibold tracking-tight text-dim">
        Nothing recorded yet.
      </p>
      <p className="max-w-xl text-body leading-relaxed text-dim">
        This timeline is intentionally empty. Entries appear here only when
        they describe something that actually happened — shipped work,
        published writing, measured experiments. No history is invented to
        fill the space.
      </p>
    </div>
  );
}

/**
 * Terminal composition — the final page of the editorial experience.
 * Restrained by design: one statement, the honest availability state, the
 * few real links that exist, and a way back up. No animation beyond the
 * site-wide reduced-motion-aware reveals.
 */
function TerminalComposition() {
  const email = CONTACT.email;

  return (
    <footer className="mt-20 border-t border-line pt-10" aria-label="End matter">
      <p className="max-w-2xl font-display text-headline font-semibold leading-tight tracking-tight text-foreground">
        {END_STATEMENT}
      </p>

      <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="space-y-4">
          {email ? (
            <a
              href={`mailto:${email}`}
              data-no-drag
              className="group flex items-center gap-2 font-mono text-micro text-accent transition-colors hover:text-foreground"
            >
              {email}
              <ArrowUpRight
                size={12}
                strokeWidth={1.5}
                aria-hidden
                className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </a>
          ) : (
            <p className="font-mono text-micro text-faint">
              Contact details not published yet
            </p>
          )}

          <StatusPill />

          <p className="font-mono text-micro text-faint">
            © {new Date().getFullYear()} {IDENTITY_DISPLAY.name}
            {IDENTITY_DISPLAY.location ? ` · ${IDENTITY_DISPLAY.location}` : ""}
          </p>
        </div>

        <button
          type="button"
          data-no-drag
          onClick={() => scrollToTarget("#index")}
          className="group inline-flex items-center gap-3 rounded-full border border-line bg-surface/70 px-6 py-3 font-mono text-micro text-dim backdrop-blur-sm transition-colors hover:border-accent-deep hover:text-accent"
        >
          Return to the beginning
          <span
            aria-hidden
            className="transition-transform duration-300 group-hover:-translate-y-0.5"
          >
            ↑
          </span>
        </button>
      </div>
    </footer>
  );
}

export function ArchiveSection() {
  const entries = sortedArchive(ARCHIVE_ENTRIES);

  return (
    <div data-inner-scroll data-lenis-prevent className="h-full overflow-y-auto overscroll-contain">
      <div className="shell pad-section-lg">
        <Eyebrow className="mb-5">Archive — 05</Eyebrow>
        <h2
          data-fluid-heading
          className="fluid-heading font-display text-headline font-semibold uppercase tracking-tight"
        >
          <KineticText text="Experiments " />
          <KineticText text="&" className="text-hollow" />
          <KineticText text=" artifacts" />
        </h2>

        <ul className="mt-10 border-t border-line">
          {entries.length > 0 ? (
            entries.map((entry) => <EntryRow key={entry.date + entry.title} entry={entry} />)
          ) : (
            <EmptyState />
          )}
        </ul>

        <TerminalComposition />
      </div>
    </div>
  );
}
