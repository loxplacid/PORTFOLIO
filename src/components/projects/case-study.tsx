"use client";

import { ArrowUpRight, Lock } from "lucide-react";
import type {
  Project,
  ProjectCaseStudy,
  ProjectLink,
  ProjectMetric,
} from "@/data/projects";
import { SITE_MODE } from "@/data/site";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * CASE STUDY — editorial architecture shared by every project surface.
 * ============================================================================
 *
 * Evidence over decoration: WHAT was built, WHY it mattered, what was hard,
 * which decisions were made, what was actually achieved. Technology appears
 * as support (tags/links/snippets), never as the story.
 *
 * Every section renders ONLY when its content exists. Metrics are
 * evidence-typed and can never present an invented number as fact.
 */

/* ------------------------------------------------------------------ */
/* Evidence-typed metrics                                              */
/* ------------------------------------------------------------------ */

function MetricCell({ metric }: { metric: ProjectMetric }) {
  return (
    <div className="px-5 py-6">
      {metric.kind === "verified" ? (
        <>
          <p className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {metric.value}
          </p>
          <p className="mt-1.5 font-mono text-micro text-faint">{metric.label}</p>
          <p className="mt-2 font-mono text-[0.6rem] leading-relaxed text-faint">
            Verified — {metric.evidence}
          </p>
        </>
      ) : metric.kind === "qualitative" ? (
        <>
          <p className="max-w-xs pt-1 text-[0.8rem] leading-relaxed text-dim">
            {metric.statement}
          </p>
          <p className="mt-1.5 font-mono text-micro text-faint">{metric.label}</p>
        </>
      ) : metric.kind === "private" ? (
        <>
          <p className="inline-flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-dim">
            <Lock size={17} strokeWidth={1.5} aria-hidden />
            Private
          </p>
          <p className="mt-1.5 font-mono text-micro text-faint">{metric.label}</p>
          {metric.note ? (
            <p className="mt-2 font-mono text-[0.6rem] leading-relaxed text-faint">
              {metric.note}
            </p>
          ) : null}
        </>
      ) : (
        <>
          <p className="font-display text-2xl font-semibold tracking-tight text-faint sm:text-3xl">
            —
          </p>
          <p className="mt-1.5 font-mono text-micro text-faint">{metric.label}</p>
          {metric.note ? (
            <p className="mt-2 font-mono text-[0.6rem] leading-relaxed text-faint">
              {metric.note}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

export function MetricGrid({ metrics }: { metrics: ProjectMetric[] }) {
  if (metrics.length === 0) return null;

  return (
    <section aria-label="Outcomes" className="space-y-4">
      <h3 className="font-mono text-micro text-faint">Outcomes</h3>
      <div
        className={cn(
          "grid divide-line rounded-xl border border-line divide-x",
          metrics.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2",
        )}
      >
        {metrics.map((metric) => (
          <MetricCell key={metric.label} metric={metric} />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Narrative sections                                                  */
/* ------------------------------------------------------------------ */

interface NarrativeSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

function toSections(cs: ProjectCaseStudy): NarrativeSection[] {
  const sections: NarrativeSection[] = [];
  if (cs.problem) sections.push({ title: "The problem", paragraphs: [cs.problem] });
  if (cs.context) sections.push({ title: "Context", paragraphs: [cs.context] });
  if (cs.constraints?.length)
    sections.push({ title: "Constraints", bullets: cs.constraints });
  if (cs.approach) sections.push({ title: "Approach", paragraphs: [cs.approach] });
  if (cs.architecture?.length)
    sections.push({ title: "Architecture decisions", bullets: cs.architecture });
  if (cs.implementation?.length)
    sections.push({ title: "Implementation notes", bullets: cs.implementation });
  if (cs.outcome) sections.push({ title: "Outcome", paragraphs: [cs.outcome] });
  if (cs.lessons?.length)
    sections.push({ title: "Lessons", bullets: cs.lessons });
  return sections;
}

export function CaseStudyNarrative({
  caseStudy,
}: {
  caseStudy: ProjectCaseStudy;
}) {
  const sections = toSections(caseStudy);
  if (sections.length === 0) return null;

  return (
    <div className="space-y-12">
      {sections.map((section) => (
        <section key={section.title} aria-label={section.title} className="space-y-4">
          <h3 className="border-b border-line pb-3 font-mono text-micro text-faint">
            {section.title}
          </h3>
          {section.paragraphs?.map((paragraph, i) => (
            <p key={i} className="max-w-2xl text-body leading-relaxed text-dim">
              {paragraph}
            </p>
          ))}
          {section.bullets ? (
            <ul className="space-y-3">
              {section.bullets.map((line, i) => (
                <li key={i} className="flex gap-4">
                  <span className="pt-0.5 font-mono text-micro text-accent-deep">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="max-w-2xl text-fine leading-relaxed text-dim">
                    {line}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Status-aware links                                                  */
/* ------------------------------------------------------------------ */

function LinkRow({ label, link }: { label: string; link?: ProjectLink }) {
  // No link configured, or not verified in live mode → honest absence.
  const usable =
    link?.url && (link.status === "verified" || SITE_MODE === "demo")
      ? link.url
      : null;

  if (!usable) return null;

  return (
    <a
      href={usable}
      target="_blank"
      rel="noreferrer"
      data-no-drag
      className="group flex items-center gap-2 rounded-full border border-line bg-surface/70 px-5 py-2.5 font-mono text-micro text-dim backdrop-blur-sm transition-colors hover:border-accent-deep hover:text-accent"
    >
      {label}
      <ArrowUpRight
        size={12}
        strokeWidth={1.5}
        aria-hidden
        className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
      />
    </a>
  );
}

export function ProjectLinks({ project }: { project: Project }) {
  const hasDemo = project.demoUrl?.url;
  const hasRepo = project.repositoryUrl?.url;

  if (!hasDemo && !hasRepo) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {hasDemo ? <LinkRow label="Live demo" link={project.demoUrl} /> : null}
      {hasRepo ? <LinkRow label="Repository" link={project.repositoryUrl} /> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Placeholder disclosure                                              */
/* ------------------------------------------------------------------ */

export function PlaceholderDisclosure() {
  if (SITE_MODE !== "demo") return null;
  return (
    <p className="rounded-lg border border-line bg-surface px-4 py-3 font-mono text-micro leading-relaxed text-faint">
      Placeholder entry — this describes a project shape, not real history.
      Replace it in src/data/projects.ts with verified work.
    </p>
  );
}
