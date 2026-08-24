"use client";

import Image from "next/image";
import { Eyebrow } from "@/components/ui/primitives";
import { KineticText } from "@/components/motion/kinetic-text";
import { IDENTITY_DISPLAY, SITE_MODE } from "@/data/site";

function Avatar() {
  const src = IDENTITY_DISPLAY.avatarSrc;

  if (src) {
    return (
      <div className="relative size-20 shrink-0 overflow-hidden rounded-full border border-line">
        <Image
          src={src}
          alt={`Portrait of ${IDENTITY_DISPLAY.name}`}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>
    );
  }

  // Graceful fallback when no photo is supplied — never a stock face.
  return (
    <div
      aria-hidden
      className="flex size-20 shrink-0 items-center justify-center rounded-full border border-line bg-surface font-display text-2xl font-semibold text-dim"
    >
      {IDENTITY_DISPLAY.initials}
    </div>
  );
}

export function AboutSection() {
  const identity = IDENTITY_DISPLAY;
  const notes = identity.aboutNotes;

  return (
    <div
      data-inner-scroll
      data-lenis-prevent
      className="h-full overflow-y-auto overscroll-contain"
    >
      <div className="shell pad-section-lg">
          <Eyebrow className="mb-5">About — 03</Eyebrow>
          <h2
            data-fluid-heading
            className="fluid-heading max-w-4xl font-display text-display font-semibold tracking-tight"
          >
            <KineticText text="Interfaces are " />
            <KineticText text="systems" className="text-hollow" />
            <KineticText text=", not screens." />
          </h2>

          <div className="mt-12 flex flex-col gap-10 lg:flex-row lg:items-start">
            {/* Identity block — renders only what exists */}
            <div className="flex items-center gap-5 border border-line bg-surface p-6 lg:w-96 lg:shrink-0">
              <Avatar />
              <div className="min-w-0">
                <p className="truncate font-display text-title font-semibold tracking-tight text-foreground">
                  {identity.name}
                </p>
                <p className="mt-1 font-mono text-micro text-dim">
                  {identity.role}
                  {identity.pronouns ? ` · ${identity.pronouns}` : ""}
                </p>
                <p className="mt-1 font-mono text-micro text-faint">
                  {identity.location ?? "Location not published"}
                </p>
                {SITE_MODE === "demo" && identity.name === null ? (
                  <p className="mt-2 font-mono text-[0.55rem] uppercase tracking-widest text-faint">
                    Placeholder name — set yours in src/data/site.ts
                  </p>
                ) : null}
              </div>
            </div>

            {/* Biography + configured notes */}
            <div className="min-w-0 flex-1 space-y-6">
              {identity.bio.map((paragraph, i) => (
                <p key={i} className="max-w-2xl text-body leading-relaxed text-dim">
                  {paragraph}
                </p>
              ))}

              {notes.length > 0 ? (
                <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
                  {notes.map((note) => (
                    <div key={note.label} className="bg-surface p-6">
                      <p className="font-mono text-micro text-accent-deep">
                        {note.label}
                      </p>
                      <p className="mt-3 text-fine leading-relaxed text-dim">
                        {note.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
  );
}
