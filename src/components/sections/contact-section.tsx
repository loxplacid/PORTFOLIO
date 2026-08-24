"use client";

import { ArrowUpRight } from "lucide-react";
import { LocalClock } from "@/components/layout/local-clock";
import { StatusPill } from "@/components/ui/status-pill";
import { KineticText } from "@/components/motion/kinetic-text";
import { Eyebrow } from "@/components/ui/primitives";
import { scrollToTarget } from "@/components/layout/smooth-scroll";
import { CONTACT, IDENTITY_DISPLAY } from "@/data/site";

function EmailLink() {
  const email = CONTACT.email;

  if (email) {
    return (
      <a
        href={`mailto:${email}`}
        data-no-drag
        className="group inline-flex items-center gap-3 font-mono text-title text-accent transition-colors hover:text-foreground"
      >
        {email}
        <ArrowUpRight
          size={22}
          strokeWidth={1.5}
          aria-hidden
          className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
        />
      </a>
    );
  }

  // Honest empty state — no address is published yet.
  return (
    <div className="inline-flex flex-col gap-2">
      <span className="font-mono text-title text-faint" aria-disabled>
        Email — not published yet
      </span>
      <p className="max-w-md text-fine text-dim">
        A direct address will appear here once published. Until then the
        availability status above is the source of truth.
      </p>
    </div>
  );
}

function SocialLinks() {
  const socials = CONTACT.socials;

  if (!CONTACT.hasSocials) {
    return (
      <span className="font-mono text-micro text-faint">
        No public profiles linked yet
      </span>
    );
  }

  return (
    <>
      {socials.map((social) => (
        <a
          key={social.label}
          href={social.resolvedUrl ?? "#"}
          target="_blank"
          rel="noreferrer"
          data-no-drag
          className="group flex items-center gap-2 font-mono text-micro text-dim transition-colors hover:text-accent"
        >
          {social.label}
          {social.handle ? (
            <span className="text-faint normal-case">{social.handle}</span>
          ) : null}
          <ArrowUpRight
            size={12}
            strokeWidth={1.5}
            aria-hidden
            className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </a>
      ))}
    </>
  );
}

function ResumeLink() {
  const url = CONTACT.resumeUrl;
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      data-no-drag
      className="group flex items-center gap-2 font-mono text-micro text-dim transition-colors hover:text-accent"
    >
      Résumé
      <ArrowUpRight
        size={12}
        strokeWidth={1.5}
        aria-hidden
        className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
      />
    </a>
  );
}

export function ContactSection() {
  return (
    <div className="flex h-full flex-col justify-center pad-screen-y">
      <div className="shell">
        <Eyebrow className="mb-5">Contact — 04</Eyebrow>
        <h2 data-fluid-heading className="fluid-heading font-display font-semibold uppercase tracking-tight">
          <KineticText text="Say" className="block text-display" />
          <KineticText text="Hello" className="block text-display text-hollow" />
        </h2>

        <div className="mt-10 flex flex-col items-start gap-6">
          <EmailLink />
          <StatusPill />
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-line pt-8">
          <SocialLinks />
          <ResumeLink />
          <span className="flex items-center gap-3 font-mono text-micro text-faint">
            {IDENTITY_DISPLAY.location ? (
              <span>{IDENTITY_DISPLAY.location} ·</span>
            ) : null}
            <LocalClock />
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
