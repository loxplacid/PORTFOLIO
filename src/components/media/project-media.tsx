"use client";

import Image from "next/image";
import { useRef, useState, useSyncExternalStore } from "react";
import type { ProjectMedia as ProjectMediaData } from "@/data/projects";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * PROJECT MEDIA — one component for every kind of project artwork.
 * ============================================================================
 *
 * Supports:
 *  - responsive images (next/image, fill + sizes)
 *  - video with poster and autoplay rules
 *  - WebGL previews via a render callback (lazy, gated)
 *  - labelled placeholder frames when no real asset exists yet
 *  - loading state (shimmer), error state, reduced-motion fallback
 *
 * HONESTY: a `webgl-placeholder` media item is DECORATIVE. It must never be
 * presented as footage of the real project — the frame is explicitly
 * labelled, and reduced-motion users get the same label without animation.
 */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void): () => void {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

function PlaceholderFrame({
  label,
  caption,
  className,
}: {
  label: string;
  caption?: string;
  className?: string;
}) {
  return (
    <figure className={cn("relative h-full w-full overflow-hidden", className)}>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--artwork-line) 1px, transparent 1px)," +
            "linear-gradient(to bottom, var(--artwork-line) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <p className="max-w-xs text-center font-mono text-micro uppercase tracking-widest text-faint">
          {label}
        </p>
      </div>
      {caption ? (
        <figcaption className="absolute inset-x-0 bottom-0 border-t border-line bg-surface/80 px-4 py-2 font-mono text-micro text-faint backdrop-blur-sm">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

interface ProjectMediaProps {
  media: ProjectMediaData;
  /** Render callback for webgl-placeholder items. Receives paused flag. */
  renderWebgl?: (opts: { paused: boolean }) => React.ReactNode;
  /** Object-fit hint for image/video content. */
  fit?: "cover" | "contain";
  sizes?: string;
  className?: string;
}

export function ProjectMedia({
  media,
  renderWebgl,
  fit = "cover",
  sizes = "(min-width: 1024px) 60rem, 100vw",
  className,
}: ProjectMediaProps) {
  const reduced = useReducedMotion();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* ---------------- no asset → labelled placeholder ---------------- */
  if (!media.src && media.kind !== "webgl-placeholder") {
    return (
      <PlaceholderFrame
        label={`No ${media.kind} asset yet`}
        caption={media.caption}
        className={className}
      />
    );
  }

  if (media.kind === "webgl-placeholder") {
    // Reduced motion or missing renderer → static labelled frame.
    if (reduced || !renderWebgl) {
      return (
        <PlaceholderFrame
          label="Decorative shader preview — not the project"
          caption={media.caption ?? media.alt}
          className={className}
        />
      );
    }
    return (
      <figure className={cn("relative h-full w-full overflow-hidden", className)}>
        <div aria-hidden={media.src ? undefined : true} className="absolute inset-0">
          {renderWebgl({ paused: false })}
        </div>
        {/* Persistent disclosure — this artwork is decorative */}
        <figcaption className="pointer-events-none absolute inset-x-0 top-0 flex justify-start p-3">
          <span className="rounded-md border border-line bg-surface/80 px-2.5 py-1.5 font-mono text-micro text-dim backdrop-blur-sm">
            Decorative shader preview — not the project
          </span>
        </figcaption>
      </figure>
    );
  }

  if (media.kind === "video") {
    return (
      <figure className={cn("relative aspect-video w-full overflow-hidden bg-surface", className)}>
        {!loaded && !failed ? (
          <div aria-hidden className="absolute inset-0 animate-pulse bg-surface" />
        ) : null}
        {failed ? (
          <PlaceholderFrame
            label="Video unavailable"
            caption={media.caption}
            className={className}
          />
        ) : (
          <video
            ref={videoRef}
            src={media.src ?? undefined}
            poster={media.poster ?? undefined}
            autoPlay={!reduced}
            loop={!reduced}
            muted
            playsInline
            preload="metadata"
            onLoadedData={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={cn(
              "h-full w-full transition-opacity duration-500",
              fit === "cover" ? "object-cover" : "object-contain",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
        )}
        {media.caption ? (
          <figcaption className="absolute inset-x-0 bottom-0 border-t border-line bg-surface/80 px-4 py-2 font-mono text-micro text-faint backdrop-blur-sm">
            {media.caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  /* ---------------- image ---------------- */
  return (
    <figure className={cn("relative h-full w-full overflow-hidden bg-surface", className)}>
      {!loaded && !failed ? (
        <div aria-hidden className="absolute inset-0 animate-pulse bg-surface" />
      ) : null}
      {failed ? (
        <PlaceholderFrame
          label="Image failed to load"
          caption={media.caption}
          className={className}
        />
      ) : (
        <Image
          src={media.src ?? ""}
          alt={media.alt}
          fill
          sizes={sizes}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "transition-opacity duration-500",
            fit === "cover" ? "object-cover" : "object-contain",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      )}
      {media.caption ? (
        <figcaption className="absolute inset-x-0 bottom-0 border-t border-line bg-surface/80 px-4 py-2 font-mono text-micro text-faint backdrop-blur-sm">
          {media.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
