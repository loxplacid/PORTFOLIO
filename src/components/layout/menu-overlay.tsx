"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { SECTIONS } from "@/data/sections";
import { scrollToTarget } from "@/components/layout/smooth-scroll";
import { useActiveSection } from "@/lib/use-active-section";
import { useEscapeKey, useScrollLock } from "@/lib/use-scroll-lock";
import { useUIStore } from "@/store/ui-store";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

export function MenuOverlay() {
  const menuOpen = useUIStore((s) => s.menuOpen);
  const closeMenu = useUIStore((s) => s.closeMenu);
  const activeNode = useActiveSection();

  useEscapeKey(menuOpen, closeMenu);
  useScrollLock(menuOpen);

  return (
    <AnimatePresence>
      {menuOpen ? (
        <motion.div
          id="site-menu"
          data-overlay
          key="site-menu"
          className="fixed inset-0 z-50 flex flex-col bg-surface/95 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <div className="shell flex flex-1 flex-col justify-center pt-16">
            <p className="mb-10 font-mono text-micro text-faint">
              Navigation — scroll to a section
            </p>
            <nav>
              <ul className="flex flex-col">
                {SECTIONS.map((section, i) => {
                  const active = activeNode === section.id;
                  return (
                    <motion.li
                      key={section.id}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{
                        duration: 0.6,
                        delay: 0.08 + i * 0.06,
                        ease: EASE,
                      }}
                      className="border-t border-line last:border-b"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          closeMenu();
                          scrollToTarget(`#${section.id}`);
                        }}
                        aria-current={active ? "page" : undefined}
                        className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-6 py-5 text-left sm:py-7"
                      >
                        <span
                          className={`font-mono text-micro transition-colors group-hover:text-accent ${
                            active ? "text-accent" : "text-faint"
                          }`}
                        >
                          {section.index}
                        </span>
                        <span
                          className={`font-display text-headline font-semibold tracking-tight transition-colors ${
                            active
                              ? "text-accent"
                              : "text-foreground group-hover:text-accent"
                          }`}
                        >
                          {section.label}
                        </span>
                        <ArrowUpRight
                          size={28}
                          strokeWidth={1.5}
                          className="text-faint transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-accent"
                        />
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            </nav>
            <p className="mt-12 font-mono text-micro text-faint">
              ESC to close · arrow keys also navigate the canvas
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
