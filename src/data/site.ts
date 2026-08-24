/**
 * ============================================================================
 * SINGLE SOURCE OF TRUTH — identity, links and deployment configuration.
 * ============================================================================
 *
 * This is the ONLY place personal information lives. Components read the
 * derived helpers (CONTACT, IDENTITY_DISPLAY) at the bottom of this file —
 * never the raw config — so replacing placeholder values requires editing
 * THIS FILE ONLY.
 *
 * No "use client" directive: this module is pure data and must stay
 * importable from server components (layout metadata, OG image, robots,
 * sitemap). Do not add hooks, effects or browser APIs here.
 *
 * HONESTY CONTRACT (non-negotiable):
 *  - `null` means "not supplied". Null values are never rendered as if real.
 *  - LinkStatus makes availability explicit: "verified" URLs are rendered as
 *    links; "unavailable" / "private" / "not-provided" are NEVER rendered as
 *    working links. UI renders graceful empty states instead.
 *  - Nothing in this file may be invented. Availability, email, socials,
 *    location and pronouns stay null until the site owner supplies them.
 *  - While SITE_MODE === "demo", clearly-marked placeholder values may render
 *    for layout purposes ONLY alongside a persistent "Demo content" badge.
 *    Flip SITE_MODE to "live" only after every placeholder below is replaced
 *    with a real value.
 */

export type LinkStatus =
  | "verified"
  | "unavailable"
  | "private"
  | "not-provided";

export type SiteMode = "demo" | "live";

/**
 * "demo" — placeholder content may render, disclosed by <DemoBadge />.
 * "live" — only verified/real values render; everything else degrades to an
 *          honest empty state. Flip this AFTER filling in real data.
 */
export const SITE_MODE: SiteMode = "demo";

/* ------------------------------------------------------------------ */
/* Deployment / environment                                            */
/* ------------------------------------------------------------------ */

/**
 * Canonical origin. Set NEXT_PUBLIC_SITE_URL in the environment for each
 * deployment (preview, production). Falls back to localhost for development.
 * Never hardcode a production domain here.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

/** Relative path that identifies the single-page home route. */
export const SITE_PATH = "/";

/**
 * Plausible Analytics domain. When null (or unset via
 * NEXT_PUBLIC_PLAUSIBLE_DOMAIN) no analytics script is loaded at all —
 * development works without credentials by design.
 */
export const ANALYTICS_DOMAIN =
  process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? null;

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

export interface Identity {
  /** Legal/full name. null until supplied — never fabricated. */
  name: string | null;
  /**
   * Brand/display name used in chrome (header, metadata) while the real name
   * is withheld. This is a placeholder — replace it with the owner's chosen
   * public name.
   */
  displayName: string;
  pronouns: string | null;
  /** City/region label. null until supplied. */
  location: string | null;
  /** Self-described role/title. Replace with the owner's real title. */
  role: string;
  /** One-sentence positioning statement used in hero + metadata. */
  positioningShort: string;
  /** Long-form biography paragraphs. Empty array → about section degrades. */
  bio: string[];
  /**
   * Optional labelled notes for the about section (practice, stack,
   * principles). Only rendered when non-empty — no defaults are invented.
   * PLACEHOLDER values below must be replaced with true statements.
   */
  aboutNotes: { label: string; text: string }[];
  /** Path to profile image under /public. null → initials fallback. */
  avatarSrc: string | null;
}

export const IDENTITY: Identity = {
  name: null,
  displayName: "folio",
  pronouns: null,
  location: null,
  role: "Design Engineer",
  positioningShort:
    "Interfaces built where typography, motion and systems engineering meet.",
  bio: [
    // PLACEHOLDER biography — replace with a first-person, factual bio.
    "Design engineer focused on interface systems — typography, motion and the rendering plumbing underneath them.",
  ],
  aboutNotes: [
    // PLACEHOLDER notes — each must become a true statement before going live.
    {
      label: "Practice",
      text: "Interface engineering for teams that care about feel — design systems, motion and the plumbing underneath.",
    },
    {
      label: "Stack",
      text: "TypeScript · React · Three.js · GLSL · Node · Rust when it earns its keep.",
    },
    {
      label: "Principles",
      text: "Measure before animating. Ship accessible by default. Delete more than you add.",
    },
  ],
  avatarSrc: null,
};

/* ------------------------------------------------------------------ */
/* Contact                                                             */
/* ------------------------------------------------------------------ */

export interface EmailContact {
  /**
   * Real contact address. null until supplied — the placeholder
   * "hello@example.com" has been removed deliberately; the UI shows an
   * honest "not published yet" state instead of a fake address.
   */
  address: string | null;
  status: LinkStatus;
}

export interface ResumeContact {
  /** Path or URL to the résumé file. null until supplied. */
  url: string | null;
  label: string;
  status: LinkStatus;
}

export interface SocialLink {
  label: string;
  /** Public handle including prefix, e.g. "@handle" or "in/handle". */
  handle: string | null;
  /** Full profile URL. Platform roots are forbidden — null until real. */
  url: string | null;
  status: LinkStatus;
}

export const EMAIL: EmailContact = {
  address: null,
  status: "not-provided",
};

export const RESUME: ResumeContact = {
  url: null,
  label: "Résumé",
  status: "not-provided",
};

/**
 * Add entries here ONLY once their real profile URL exists. Do not restore
 * platform-root URLs (https://github.com etc.) — they rendered as if the
 * owner had a presence there, which is exactly what this system removes.
 */
export const SOCIALS: SocialLink[] = [
  { label: "GitHub", handle: null, url: null, status: "not-provided" },
  { label: "LinkedIn", handle: null, url: null, status: "not-provided" },
];

/* ------------------------------------------------------------------ */
/* Availability                                                        */
/* ------------------------------------------------------------------ */

/**
 * Present-tense availability claim ("Open to full-time roles", "Booking
 * freelance from March"). null until the owner sets it truthfully —
 * the previous hardcoded "Available for contract" was a fabrication
 * and has been removed.
 */
export const AVAILABILITY: string | null = null;

/** Optional secondary context line (timezone, region). null until supplied. */
export const AVAILABILITY_CONTEXT: string | null = null;

/* ------------------------------------------------------------------ */
/* Editorial end matter                                                */
/* ------------------------------------------------------------------ */

/**
 * Final statement closing the archive/page. Authored voice, no fabricated
 * facts — replace freely, but keep it true.
 */
export const END_STATEMENT =
  "This portfolio is intentionally incomplete — it grows as real work earns its place here.";

/* ------------------------------------------------------------------ */
/* Derived helpers — components read THESE, never the raw config above */
/* ------------------------------------------------------------------ */

function usable(url: string | null, status: LinkStatus): string | null {
  if (!url) return null;
  if (status === "verified") return url;
  // In demo mode unverified URLs may render for layout, but they are always
  // accompanied by placeholder disclosure. In live mode they never render.
  if (SITE_MODE === "demo") return url;
  return null;
}

function shown(status: LinkStatus): boolean {
  if (status === "not-provided") return false;
  if (status === "verified") return true;
  return SITE_MODE === "demo";
}

export const CONTACT = {
  mode: SITE_MODE,
  isDemo: SITE_MODE === "demo",

  /** Resolved email address, or null when it must not be displayed. */
  get email(): string | null {
    return usable(EMAIL.address, EMAIL.status);
  },

  get emailStatus(): LinkStatus {
    return EMAIL.status;
  },

  /** Résumé URL, or null when it must not be displayed. */
  get resumeUrl(): string | null {
    return usable(RESUME.url, RESUME.status);
  },

  get resumeStatus(): LinkStatus {
    return RESUME.status;
  },

  /** Social links that may be rendered (resolved url attached). */
  get socials() {
    return SOCIALS.map((social) => ({
      ...social,
      resolvedUrl: usable(social.url, social.status),
      visible: social.url ? shown(social.status) : false,
    })).filter((social) => social.visible);
  },

  get hasSocials(): boolean {
    return this.socials.length > 0;
  },

  /** Availability claim, or null when it must not be displayed. */
  get availability(): string | null {
    return AVAILABILITY;
  },

  get availabilityContext(): string | null {
    return AVAILABILITY_CONTEXT ?? IDENTITY.location;
  },
};

/**
 * Presentation-ready identity: resolves which fields exist so components can
 * degrade gracefully instead of rendering placeholders as facts.
 */
export const IDENTITY_DISPLAY = {
  /** Name to show publicly: real name when supplied, else display name. */
  get name(): string {
    return IDENTITY.name ?? IDENTITY.displayName;
  },

  get pronouns(): string | null {
    return IDENTITY.pronouns;
  },

  get location(): string | null {
    return IDENTITY.location;
  },

  get role(): string {
    return IDENTITY.role;
  },

  get positioningShort(): string {
    return IDENTITY.positioningShort;
  },

  get bio(): string[] {
    return IDENTITY.bio;
  },

  get aboutNotes(): { label: string; text: string }[] {
    return IDENTITY.aboutNotes;
  },

  get avatarSrc(): string | null {
    return IDENTITY.avatarSrc;
  },

  /** Initials for the avatar fallback chip. */
  get initials(): string {
    const source = IDENTITY.name ?? IDENTITY.displayName;
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  },
} as const;
