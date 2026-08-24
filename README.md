# folio — design engineer portfolio

Single-page, pinned-scroll portfolio built as an interface-systems showcase:
Navier–Stokes fluid background, liquid-metal hero scene, kinetic variable-font
typography, matrix-morph case studies, ⌘K command palette, opt-in synthesized
sound.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Framer Motion · GSAP ScrollTrigger · Lenis · Three.js + R3F + drei · Zustand · cmdk

## Scripts

```bash
npm run dev     # development server (Turbopack)
npm run build   # production build + typecheck
npm run start   # serve production build
npm run lint    # eslint
```

## Structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full directory contract,
design-token rules, motion conventions and performance gates.

```
src/app          routes, layout, global tokens
src/components   layout chrome · sections · ui primitives · motion primitives
                 projects domain · canvas experiments
src/data         typed content modules (edit these to change the site)
src/lib          engines and utilities (audio, fluid sim, physics, highlight)
src/store        zustand ui state
```

## Content

All identity content lives in `src/data/site.ts` and `src/data/projects.ts`.
Current values are **placeholders** — replace names, email, socials, project
entries, metrics and links before deploying. No achievements or history are
claimed anywhere in the codebase; everything is data-driven.

## Accessibility & performance contracts

- Skip link → `#main`; single `h1`; hierarchical headings
- Full keyboard paths: palette (⌘K), menu, explorer (Esc/backdrop/swipe)
- `prefers-reduced-motion`: Lenis off, depth stack static, WebGL replaced by
  static gradients, kinetic/magnetic systems disabled
- WebGL contexts are capability-gated, visibility-paused, DPR-capped and
  tier-degraded via PerformanceMonitor
