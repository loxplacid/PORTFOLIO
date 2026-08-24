"use client";

import { CONTACT } from "@/data/site";
import { cn } from "@/lib/utils";

/**
 * Availability pill — renders ONLY what the owner has truthfully configured
 * in src/data/site.ts. With no availability claim and no context (location /
 * timezone) it renders nothing at all rather than implying a status.
 */
export function StatusPill({ className }: { className?: string }) {
  const availability = CONTACT.availability;
  const context = CONTACT.availabilityContext;

  if (!availability && !context) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/80 py-2 pl-3 pr-4 font-mono text-micro text-dim backdrop-blur-sm",
        className,
      )}
    >
      {availability ? (
        <span className="relative flex size-2 shrink-0">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-50" />
          <span className="relative inline-flex size-2 animate-pulse-dot rounded-full bg-accent" />
        </span>
      ) : (
        <span className="relative inline-flex size-2 rounded-full bg-faint" />
      )}
      <span className="whitespace-nowrap">
        {availability ?? context}
        {availability && context ? (
          <span className="ml-2 text-faint">{context}</span>
        ) : null}
      </span>
    </div>
  );
}
