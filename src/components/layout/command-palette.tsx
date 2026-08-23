"use client";

import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { PROJECTS, PROJECT_TAGS } from "@/data/projects";
import { SECTIONS } from "@/data/sections";
import { SITE } from "@/data/site";
import { audio } from "@/lib/audio-engine";
import { scrollToTarget } from "./smooth-scroll";
import { useUIStore } from "@/store/ui-store";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

export function openCommandPalette(): void {
  window.dispatchEvent(new Event("open-command-palette"));
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const soundEnabled = useUIStore((s) => s.soundEnabled);
  const toggleSound = useUIStore((s) => s.toggleSound);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const initTheme = useUIStore((s) => s.initTheme);
  const graphicsOverride = useUIStore((s) => s.graphicsOverride);
  const cycleGraphics = useUIStore((s) => s.cycleGraphics);
  const requestProject = useUIStore((s) => s.requestProject);
  const requestTagFilter = useUIStore((s) => s.requestTagFilter);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "theme-light",
      theme === "light",
    );
  }, [theme]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    const onOpenEvent = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpenEvent);
    };
  }, []);

  function run(action: () => void | Promise<void>) {
    audio.snap();
    setOpen(false);
    window.setTimeout(() => void action(), 90);
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(SITE.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0 bg-background/60"
            initial={{ backdropFilter: "blur(0px)" }}
            animate={{ backdropFilter: "blur(14px)" }}
            exit={{ backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.3, ease: EASE }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className="absolute inset-x-0 top-[16%] mx-auto w-[min(36rem,92vw)]"
            initial={{ opacity: 0, scale: 0.94, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
          >
            <Command
              loop
              className="overflow-hidden rounded-xl border border-line bg-surface/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
              onKeyDown={(event) => {
                if (event.key === "Escape") setOpen(false);
              }}
            >
              <Command.Input
                autoFocus
                placeholder="Type a command or search…"
                className="w-full border-b border-line bg-transparent px-5 py-4 font-mono text-sm text-foreground outline-none placeholder:text-faint"
              />
              <Command.List className="max-h-[48vh] overflow-y-auto p-2 [scrollbar-width:thin]">
                <Command.Empty className="px-3 py-8 text-center font-mono text-micro text-faint">
                  No matches.
                </Command.Empty>

                <Group heading="Navigate">
                  {SECTIONS.map((section) => (
                    <Item
                      key={section.id}
                      onSelect={() =>
                        run(() => scrollToTarget(`#${section.id}`))
                      }
                      hint={section.index}
                    >
                      {section.label}
                    </Item>
                  ))}
                </Group>

                <Group heading="Filter tech stack">
                  {PROJECT_TAGS.map((tag) => (
                    <Item
                      key={tag}
                      onSelect={() =>
                        run(() => {
                          requestTagFilter(tag);
                          scrollToTarget("#work");
                        })
                      }
                      hint="filter"
                    >
                      {tag}
                    </Item>
                  ))}
                </Group>

                <Group heading="Open project">
                  {PROJECTS.map((project) => (
                    <Item
                      key={project.id}
                      onSelect={() => run(() => requestProject(project.id))}
                      hint={project.tags[0]}
                    >
                      {project.title}
                    </Item>
                  ))}
                </Group>

                <Group heading="Actions">
                  <Item
                    onSelect={() => run(toggleSound)}
                    hint={soundEnabled ? "on" : "off"}
                  >
                    Toggle sound
                  </Item>
                  <Item
                    onSelect={() => run(toggleTheme)}
                    hint={theme === "dark" ? "dark" : "light"}
                  >
                    Toggle theme
                  </Item>
                  <Item
                    onSelect={() => run(cycleGraphics)}
                    hint={graphicsOverride}
                  >
                    Graphics quality
                  </Item>
                  <Item
                    onSelect={() => run(copyEmail)}
                    hint={copied ? "copied" : "clipboard"}
                  >
                    {copied ? "Email copied to clipboard" : SITE.email}
                  </Item>
                </Group>
              </Command.List>

              <div className="flex items-center justify-between border-t border-line px-4 py-2.5 font-mono text-micro text-faint">
                <span>↑↓ navigate · ↵ select</span>
                <span>ESC to close</span>
              </div>
            </Command>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Group({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <Command.Group
      heading={heading}
      className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-micro [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-faint"
    >
      {children}
    </Command.Group>
  );
}

function Item({
  children,
  hint,
  onSelect,
}: {
  children: ReactNode;
  hint?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 font-mono text-micro text-dim transition-colors data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent"
    >
      <span>{children}</span>
      {hint ? <span className="text-faint">{hint}</span> : null}
    </Command.Item>
  );
}
