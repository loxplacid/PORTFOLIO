"use client";

import { Check, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import type { ProjectSnippet } from "@/data/projects";
import { tokenize, type TokenKind } from "@/lib/highlight";
import { cn } from "@/lib/utils";

const KIND_CLASS: Record<TokenKind, string> = {
  plain: "text-dim",
  comment: "text-faint italic",
  string: "text-foreground",
  number: "text-accent-deep",
  keyword: "text-accent",
  call: "text-foreground font-medium",
};

export function CodeBlock({
  snippet,
  lineNumbers = false,
}: {
  snippet: ProjectSnippet;
  lineNumbers?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const tokens = useMemo(
    () => tokenize(snippet.code, snippet.language),
    [snippet],
  );
  const lineCount = useMemo(
    () => snippet.code.split("\n").length,
    [snippet.code],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-background/80">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2 rounded-full bg-faint/60" />
            <span className="size-2 rounded-full bg-faint/40" />
            <span className="size-2 rounded-full bg-faint/25" />
          </span>
          <span className="font-mono text-micro text-dim">
            {snippet.title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded border border-line px-1.5 py-0.5 font-mono text-micro uppercase text-faint">
            {snippet.language}
          </span>
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? "Copied" : "Copy code"}
            className={cn(
              "transition-colors",
              copied ? "text-accent" : "text-faint hover:text-foreground",
            )}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>
      <div className="flex">
        {lineNumbers ? (
          <div
            aria-hidden
            className="select-none border-r border-line px-3 py-4 text-right font-mono text-[0.78rem] leading-6 text-faint/70"
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        ) : null}
        <pre className="flex-1 overflow-x-auto p-4 font-mono text-[0.78rem] leading-6">
          <code>
            {tokens.map((token, i) => (
              <span key={i} className={KIND_CLASS[token.kind]}>
                {token.text}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
