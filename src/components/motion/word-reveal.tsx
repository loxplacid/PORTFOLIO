"use client";

import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

export interface RevealLine {
  id: string;
  text: string;
  className?: string;
}

interface WordRevealProps {
  lines: RevealLine[];
  baseDelay?: number;
  step?: number;
  onView?: boolean;
}

export function WordReveal({
  lines,
  baseDelay = 0,
  step = 0.12,
  onView = false,
}: WordRevealProps) {
  let wordCount = 0;
  const delays = lines.map((line) =>
    line.text.split(" ").map(() => baseDelay + wordCount++ * step),
  );

  return (
    <>
      {lines.map((line, lineIdx) => (
        <span key={line.id} className={`block ${line.className ?? ""}`}>
          {line.text.split(" ").map((word, wordIdx) => (
            <span
              key={`${line.id}-${wordIdx}`}
              className="mr-[0.24em] -mb-[0.12em] inline-block overflow-hidden px-[0.05em] pb-[0.12em] align-top last:mr-0"
            >
              <motion.span
                className="inline-block will-change-transform"
                initial={{ y: "112%" }}
                {...(onView
                  ? {
                      whileInView: { y: "0%" },
                      viewport: { once: true, margin: "-12% 0px" },
                    }
                  : { animate: { y: "0%" } })}
                transition={{
                  duration: 1.05,
                  delay: delays[lineIdx][wordIdx],
                  ease: EASE,
                }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </span>
      ))}
    </>
  );
}
