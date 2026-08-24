import type { ReactNode } from "react";

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`font-mono text-micro uppercase text-faint ${className ?? ""}`}
    >
      {children}
    </p>
  );
}

export function MetaText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`font-mono text-micro text-dim ${className ?? ""}`}>
      {children}
    </span>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div aria-hidden className={`border-t border-line ${className ?? ""}`} />;
}

export function SectionHeader({
  eyebrow,
  title,
  aside,
}: {
  eyebrow: string;
  title: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
      <div>
        <Eyebrow className="mb-5">{eyebrow}</Eyebrow>
        {title}
      </div>
      {aside ? (
        <div className="max-w-xs pb-1 text-right font-mono text-micro text-faint">
          {aside}
        </div>
      ) : null}
    </div>
  );
}
