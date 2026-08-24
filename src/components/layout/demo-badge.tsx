"use client";

import { SITE_MODE } from "@/data/site";

/**
 * Persistent honesty disclosure while the site runs on placeholder content.
 * Disappears automatically once SITE_MODE flips to "live".
 */
export function DemoBadge() {
  if (SITE_MODE !== "demo") return null;
  return (
    <div
      title="Placeholder content — replace src/data/site.ts and src/data/projects.ts"
      className="pointer-events-auto fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full border border-line bg-surface/85 px-3.5 py-2 font-mono text-micro uppercase tracking-widest text-faint backdrop-blur-md"
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full border border-line-hover bg-transparent"
      />
      Demo content
    </div>
  );
}
