import type { Metadata, Viewport } from "next";
import { Analytics } from "@/components/layout/analytics";
import { Backdrop } from "@/components/layout/backdrop";
import { CommandPalette } from "@/components/layout/command-palette";
import { DemoBadge } from "@/components/layout/demo-badge";
import { FluidFilterDefs } from "@/components/layout/fluid-filter-defs";
import { MenuOverlay } from "@/components/layout/menu-overlay";
import { SiteHeader } from "@/components/layout/site-header";
import { SmoothScroll } from "@/components/layout/smooth-scroll";
import { MotionProvider } from "@/components/motion/motion-provider";
import { CustomCursor } from "@/components/ui/custom-cursor";
import { fontVariables } from "@/lib/fonts";
import { IDENTITY_DISPLAY, SITE_MODE, SITE_URL } from "@/data/site";
import "./globals.css";

const title = `${IDENTITY_DISPLAY.name} — ${IDENTITY_DISPLAY.role}`;
const description = IDENTITY_DISPLAY.positioningShort;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: title,
    template: `%s — ${IDENTITY_DISPLAY.name}`,
  },
  description,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title,
    description,
    type: "website",
    siteName: IDENTITY_DISPLAY.name,
    url: SITE_URL,
    // og:image / og:image:alt are wired automatically by the
    // src/app/opengraph-image.tsx file convention.
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    // twitter:image is wired automatically by twitter-image.tsx.
  },
  robots: SITE_MODE === "live" ? undefined : {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
    { media: "(prefers-color-scheme: light)", color: "#f4f4f5" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${fontVariables} h-full`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SmoothScroll>
          <MotionProvider>
            <Backdrop />
            <FluidFilterDefs />
            <SiteHeader />
            {children}
            <MenuOverlay />
            <CustomCursor />
            <CommandPalette />
            {/* Honesty disclosure while placeholder content is on screen. */}
            <DemoBadge />
            {/* Renders nothing until NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set. */}
            <Analytics />
          </MotionProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
