/**
 * ============================================================================
 * ARCHIVE DATA MODEL — biographical record, empty until real.
 * ============================================================================
 *
 * The archive previously held illustrative entries that implied a history
 * ("2023 — first quantized demo", "2022 — early magnetic UI"). Those were
 * fiction and have been removed. This file ships EMPTY on purpose.
 *
 * Add entries ONLY when they describe something that actually happened.
 * Each entry carries an explicit type and an ISO date so the timeline can
 * never blur illustration into biography.
 */

export const ARCHIVE_TYPES = [
  "project",
  "experiment",
  "article",
  "note",
  "learning",
  "milestone",
  "prototype",
] as const;

export type ArchiveType = (typeof ARCHIVE_TYPES)[number];

export interface ArchiveEntry {
  /** ISO date (YYYY-MM-DD). Displayed as YYYY · MM. */
  date: string;
  title: string;
  type: ArchiveType;
  /** One-line factual description. Optional. */
  description?: string;
  /** Related project slug in src/data/projects.ts, if any. */
  projectSlug?: string;
  link?: {
    url: string;
    label: string;
    status: "verified" | "unavailable" | "private" | "not-provided";
  };
}

/**
 * Real archive entries go here. Template (delete the block comment to use):
 *
 * {
 *   date: "2026-08-25",
 *   title: "Portfolio rebuilt around evidence-based content",
 *   type: "milestone",
 *   description: "Replaced placeholder content architecture with a single identity source and evidence-typed metrics.",
 *   projectSlug: undefined,
 * },
 */
export const ARCHIVE_ENTRIES: ArchiveEntry[] = [];

export function sortedArchive(entries: ArchiveEntry[]): ArchiveEntry[] {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}
