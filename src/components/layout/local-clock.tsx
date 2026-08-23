"use client";

import { useEffect, useState } from "react";
import { useMounted } from "@/lib/use-mounted";

export function LocalClock() {
  const mounted = useMounted();
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const format = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const frame = requestAnimationFrame(() => {
      setTime(format.format(new Date()));
    });
    const id = window.setInterval(
      () => setTime(format.format(new Date())),
      1000,
    );
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(id);
    };
  }, []);

  return (
    <span className="font-mono text-micro tabular-nums text-dim">
      {mounted && time ? time : "--:--:--"} LOCAL
    </span>
  );
}
