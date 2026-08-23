"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const STATUS = [
  { tone: "live", label: "Available for contract", icon: null },
  { tone: "info", label: "Remote — worldwide", icon: MapPin },
] as const;

export function StatusPill({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % STATUS.length),
      6000,
    );
    return () => window.clearInterval(id);
  }, [paused]);

  const status = STATUS[index];
  const Icon = status.icon;

  return (
    <motion.button
      layout
      type="button"
      aria-live="polite"
      onClick={() => setIndex((i) => (i + 1) % STATUS.length)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/80 py-2 pl-3 pr-4 font-mono text-micro text-dim backdrop-blur-sm transition-colors hover:border-accent-deep hover:text-foreground",
        className,
      )}
    >
      <span className="relative flex size-2 shrink-0">
        {status.tone === "live" ? (
          <>
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-50" />
            <span className="relative inline-flex size-2 animate-pulse-dot rounded-full bg-accent" />
          </>
        ) : (
          <span className="relative inline-flex size-2 rounded-full bg-faint" />
        )}
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={status.label}
          initial={{ y: 9, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -9, opacity: 0 }}
          transition={{ duration: 0.28, ease: EASE }}
          className="flex items-center gap-2 whitespace-nowrap"
        >
          {Icon ? (
            <Icon size={11} strokeWidth={1.75} className="text-faint" />
          ) : null}
          {status.label}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
