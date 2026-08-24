import Script from "next/script";
import { ANALYTICS_DOMAIN } from "@/data/site";

/**
 * Analytics — Plausible, privacy-friendly, cookieless.
 *
 * Renders NOTHING unless NEXT_PUBLIC_PLAUSIBLE_DOMAIN is configured, so
 * development and preview deployments work without credentials by design.
 * Set the env var per deployment (see .env.example) to activate.
 */
export function Analytics() {
  if (!ANALYTICS_DOMAIN) return null;

  return (
    <Script
      defer
      data-domain={ANALYTICS_DOMAIN}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
