# Architecture

Single-page pinned-scroll portfolio. Next.js App Router · React 19 · Tailwind v4 · Framer Motion + GSAP + Lenis · Three.js/R3F · Zustand · cmdk.

## Directory contract

```
src/
  app/            Routes only: layout, page, globals.css, meta routes
  components/
    layout/       Chrome + providers (header, overlays, cursor, palette,
                  scroll bridge, backdrop sim, filter defs)
    sections/     One file per pinned screen (hero, work, about, contact, archive)
    projects/     Project-domain components (list wiring, floating preview,
                  matrix-morph explorer, sandbox preview, procedural visuals)
    hero/         Hero-scene internals (WebGL scene, fallback)
    canvas/       Standalone WebGL/canvas experiments (unmounted by default:
                  FluidShaderCanvas, PostProcessingPipeline, KineticText)
    motion/       Reusable motion primitives (Reveal, WordReveal, KineticText,
                  MotionProvider)
    ui/           Design-system primitives (primitives.tsx: Eyebrow/MetaText/
                  Divider/SectionHeader; status-pill, glass-chip, magnetic-link,
                  custom-cursor, code-block)
  data/           Typed content modules (projects, sections, site) — the ONLY
                  place content lives
  lib/            Pure TS engines/utilities, no React (audio-engine, fluid-sim,
                  physics/, color, highlight, fonts, motion-tokens, capabilities
                  hooks live in hooks-style files here by convention: use-*.ts)
  store/          Zustand UI state
```

## Rules

1. **Content** lives in `src/data/*` and is typed. Components never hardcode copy that a user would edit.
2. **Server vs client**: app/page/layout are server components; client islands import them via props. Anything using hooks/state/effects declares `"use client"`.
3. **Motion tokens** come from `lib/motion-tokens.ts` (EASE_EXPO, EASE_IN_OUT_QUINT, SPRING_LAYOUT 300/30, SPRING_FOLLOW 150/15, ENTER/EXIT transitions). No local ease tuples.
4. **Spacing**: `pad-screen-y` for pinned-screen interiors, `pad-section-lg` for scrollable panels, `shell` for horizontal rhythm. No ad-hoc vertical paddings in sections.
5. **Color**: semantic Tailwind tokens only (`background/surface/raised/line/line-hover/foreground/dim/faint/accent/accent-deep`) mapped to `:root` vars. Raw hex appears only inside GLSL strings and data-driven artwork hues.
6. **GPU layers**: interactive transform-heavy elements carry `gpu-layer`.
7. **Overlays**: portal to body; declare `data-overlay`; Esc ordering inspector → overlay; focus moves to close control on open.
8. **Performance gates**: WebGL mounts behind capability + reduced-motion checks; frameloops pause off-screen (`IntersectionObserver` / PerformanceMonitor); DPR capped; quality tiers step down before falling back to static/2D modes.
9. **Accessibility**: skip link to `#main`; one `h1` per page; headings hierarchical; `aria-current` on active nav; `aria-live` for dynamic counts/status; visible focus ring everywhere; reduced-motion disables all non-essential animation.

## Background system

`Backdrop` picks one mode at runtime: Navier–Stokes simulation (WebGL2 + float
buffers required), animated 2D noise canvas, or static gradient (reduced motion).
The NS probe buffer also drives heading displacement via `--fluid-e` CSS var and
the shared `#ns-displace` SVG filter defined by `FluidFilterDefs`.

Hero owns its own scene with GPU-tier scaling; both contexts pause when their content leaves the
viewport. Do not add a third always-on context.

## Content honesty system

- `src/data/site.ts` is the single identity/link/deployment source. It is pure data (no
  `"use client"`), so server components (metadata, OG image, robots) and client islands read the
  same config. `SITE_MODE` gates placeholder disclosure (`DemoBadge`, `noindex`) — flip to
  `"live"` only after every placeholder is replaced.
- Link status is explicit (`verified / unavailable / private / not-provided`). Unverified links
  never render as working URLs in live mode; contact/socials/resume degrade to honest empty states.
- Project metrics are evidence-typed: `verified` (requires `evidence`), `qualitative`,
  `unavailable` ("—"), `private` ("Private" + optional scope note). Invented numbers can never
  render as fact.
- Archive ships empty on purpose; entries require type + ISO date. The empty state says so.

## OG / share image

`src/app/opengraph-image.tsx` (and `twitter-image.tsx`) render an authored 1200×630 card via
`next/og` from the identity source at build time. No binary asset to keep in sync; composition
mirrors the site's hairline-frame editorial language. Metadata wiring (`metadataBase`,
canonical, og/twitter images) lives in `app/layout.tsx`.

## Deployment configuration

Environment-aware, no hardcoded production domain:

- `NEXT_PUBLIC_SITE_URL` → canonical origin (falls back to localhost for dev).
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` → Plausible analytics; when unset the script never loads
  (`components/layout/analytics.tsx`). See `.env.example`.
- `robots.ts` serves `disallow: /` while `SITE_MODE === "demo"`; sitemap points at the canonical URL.

## Worker GL decision (evidence-driven)

The hero scene runs entirely in a Web Worker (`workers/hero-gl.worker.ts`) via OffscreenCanvas —
physics, raycasting and post-processing cost zero main-thread frame time. It stays **active**, not
dormant, because it is wired behind capability gates that already answer the review checklist:

- support: WebGL2/WebGL + `OffscreenCanvas.transferControlToOffscreen` probes (`use-webgl-mode.ts`)
- fallback: reduced-motion / coarse pointer / ≤820px → static field; worker load failure or a
  4s ready-timeout now also falls back instead of leaving a blank canvas
- resize/DPR: ResizeObserver-driven, DPR capped per tier, auto pixel-ratio downgrade on sustained low FPS
- cleanup/memory: worker terminated on unmount; orb geometry/materials disposed on section exit,
  VRAM reported over the protocol
- mobile/reduced-motion: gated off by design (single-threaded fallback renders instead)

Do not add a second main-thread renderer alongside it. If profiling ever shows the worker path
costing more than it saves (unlikely: message traffic is tiny, rendering is GPU-bound),
decommission it rather than duplicating the pipeline.
