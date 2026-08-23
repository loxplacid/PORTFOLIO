"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useEffect, useRef } from "react";
import { getSection } from "@/data/sections";
import { scrollToTarget } from "@/components/layout/smooth-scroll";
import { openCommandPalette } from "@/components/layout/command-palette";
import { SoundToggle } from "@/components/layout/sound-toggle";
import { useActiveSection } from "@/lib/use-active-section";
import { audio } from "@/lib/audio-engine";
import { useUIStore } from "@/store/ui-store";

export function SiteHeader() {
  const active = useActiveSection();
  const menuOpen = useUIStore((s) => s.menuOpen);
  const toggleMenu = useUIStore((s) => s.toggleMenu);
  const node = getSection(active);

  const previous = useRef(active);
  useEffect(() => {
    if (previous.current !== active) {
      audio.sectionCue();
      previous.current = active;
    }
  }, [active]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-background/75 backdrop-blur-md">
      <div className="shell flex h-16 items-center justify-between">
        <button
          type="button"
          data-no-drag
          onClick={() => scrollToTarget("#index")}
          className="group flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight"
        >
          <span className="text-accent transition-transform duration-500 group-hover:rotate-180">
            *
          </span>
          <span>folio</span>
        </button>

        <div className="flex items-center gap-3">
          <p className="hidden items-center gap-2 font-mono text-micro text-dim sm:flex">
            <span className="text-faint">[</span>
            {node.index} / {node.label}
            <span className="text-faint">]</span>
            <span
              aria-hidden
              className="ml-1 size-1.5 rounded-full bg-accent animate-pulse-dot"
            />
          </p>

          <button
            type="button"
            data-no-drag
            onClick={openCommandPalette}
            title="Command palette (⌘K)"
            aria-label="Open command palette"
            className="hidden items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-2 font-mono text-micro text-faint transition-colors hover:border-line-hover hover:text-accent sm:flex"
          >
            <span>⌘K</span>
          </button>

          <SoundToggle />

          <button
            type="button"
            data-no-drag
            onClick={() => {
              audio.snap();
              toggleMenu();
            }}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 font-mono text-micro text-foreground transition-colors hover:border-line-hover hover:text-accent"
          >
            <motion.span
              animate={{ rotate: menuOpen ? 45 : 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="-mr-0.5 inline-flex"
            >
              <Plus size={14} strokeWidth={2} />
            </motion.span>
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>
    </header>
  );
}
