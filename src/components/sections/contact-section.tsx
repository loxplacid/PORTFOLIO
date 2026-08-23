"use client";

import { ArrowUpRight } from "lucide-react";
import { LocalClock } from "@/components/layout/local-clock";
import { StatusPill } from "@/components/ui/status-pill";
import { KineticText } from "@/components/motion/kinetic-text";
import { scrollToTarget } from "@/components/layout/smooth-scroll";
import { SITE } from "@/data/site";

export function ContactSection() {
  return (
    <div className="flex h-[100svh] flex-col justify-center py-16">
      <div className="shell">
        <p className="mb-5 font-mono text-micro text-faint">Contact — 05</p>
        <h2 data-fluid-heading className="fluid-heading font-display font-semibold uppercase tracking-tight">
          <KineticText text="Say" className="block text-display" />
          <KineticText text="Hello" className="block text-display text-hollow" />
        </h2>

        <div className="mt-10 flex flex-col items-start gap-6">
          <a
            href={`mailto:${SITE.email}`}
            data-no-drag
            className="group inline-flex items-center gap-3 font-mono text-title text-accent transition-colors hover:text-foreground"
          >
            {SITE.email}
            <ArrowUpRight
              size={22}
              strokeWidth={1.5}
              className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
            />
          </a>

          <StatusPill />
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-line pt-8">
          {SITE.socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              data-no-drag
              className="group flex items-center gap-2 font-mono text-micro text-dim transition-colors hover:text-accent"
            >
              {social.label}
              <ArrowUpRight
                size={12}
                strokeWidth={1.5}
                className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden
              />
            </a>
          ))}
          <span className="font-mono text-micro text-faint">
            {SITE.location} · <LocalClock />
          </span>
          <button
            type="button"
            data-no-drag
            onClick={() => scrollToTarget("#index")}
            className="ml-auto flex items-center gap-2 rounded-full border border-line px-4 py-2 font-mono text-micro text-dim transition-colors hover:border-accent-deep hover:text-accent"
          >
            Back to index
          </button>
        </div>
      </div>
    </div>
  );
}
