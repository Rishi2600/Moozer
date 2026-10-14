"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

// Draws children at a fixed design size and scales them to the box's width,
// like a video, so the film looks the same on every screen.
export function ScaledCanvas({ width, height, className, children }: { width: number; height: number; className?: string; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);
  return (
    <div ref={box} className={cn("relative w-full overflow-hidden", className)} style={{ aspectRatio: `${width} / ${height}` }}>
      <div className="absolute top-0 left-0 origin-top-left" style={{ width, height, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

// A browser window showing Moozer.
export function LaptopFrame({ url, className, children }: { url: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col overflow-hidden rounded-2xl border border-border-strong/60 bg-background shadow-sunlit", className)}>
      <div className="flex h-9 shrink-0 items-center gap-3 border-b border-border/60 bg-card px-4">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="mx-auto w-80 truncate rounded-md bg-muted px-3 py-0.5 text-center text-body-sm text-muted-foreground">{url}</span>
      </div>
      <div className="relative min-h-0 flex-1">{children}</div>
    </div>
  );
}

// A phone showing Moozer.
export function PhoneFrame({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("relative overflow-hidden rounded-[2.25rem] border-[6px] border-inverse-surface bg-background shadow-sunlit", className)}>
      <span aria-hidden className="absolute top-2 left-1/2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-inverse-surface" />
      <div className="relative size-full pt-10">{children}</div>
    </div>
  );
}
