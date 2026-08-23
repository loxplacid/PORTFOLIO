import type { Metadata, Viewport } from "next";
import { Backdrop } from "@/components/layout/backdrop";
import { CommandPalette } from "@/components/layout/command-palette";
import { FluidFilterDefs } from "@/components/layout/fluid-filter-defs";
import { MenuOverlay } from "@/components/layout/menu-overlay";
import { SiteHeader } from "@/components/layout/site-header";
import { SmoothScroll } from "@/components/layout/smooth-scroll";
import { MotionProvider } from "@/components/motion/motion-provider";
import { CustomCursor } from "@/components/ui/custom-cursor";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Portfolio",
    template: "%s — Portfolio",
  },
  description:
    "Selected work and experiments — an interface practice built on typography, motion and systems engineering.",
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${fontVariables} h-full`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground antialiased">
        <SmoothScroll>
          <MotionProvider>
            <Backdrop />
            <FluidFilterDefs />
            <SiteHeader />
            {children}
            <MenuOverlay />
            <CustomCursor />
            <CommandPalette />
          </MotionProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
