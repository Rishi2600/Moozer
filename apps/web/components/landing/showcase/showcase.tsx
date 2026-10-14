"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { LaptopFrame, PhoneFrame, ScaledCanvas } from "./frames";
import { HostScreen } from "./host-screen";
import { SCENES, SPACE_NAME, filmState } from "./scenes";
import { useSceneClock } from "./use-scene-clock";

// The landing page's product film: a laptop (the host) and a phone (a guest)
// act out a space, scene by scene, with a caption and a chapter bar. Plays
// only while on screen; never auto-plays with reduced motion.
export function Showcase({ qr }: { qr: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const { scene, p, jump } = useSceneClock(visible && !paused && !reduced);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.35 });
    if (root.current) observer.observe(root.current);
    return () => {
      media.removeEventListener("change", sync);
      observer.disconnect();
    };
  }, []);

  const current = SCENES[scene];
  const film = { scene: current.id, ...filmState(current.id, reduced ? 1 : p) };
  return (
    <div ref={root} className="flex flex-col gap-6" aria-label="A short tour of Moozer" role="region">
      <ScaledCanvas width={1200} height={675} className="hidden md:block">
        <div className="relative size-full">
          <LaptopFrame url={`moozer.app/s/${SPACE_NAME.toLowerCase().replaceAll(" ", "-")}`} className="absolute top-6 left-0 h-[620px] w-[890px]">
            <HostScreen film={film} qr={qr} sharing={current.id === "share"} />
          </LaptopFrame>
          <PhoneFrame className="absolute right-0 bottom-0 h-[600px] w-[290px]">
            <div className="p-4 text-label-md text-muted-foreground">Guest: {film.scene}</div>
          </PhoneFrame>
        </div>
      </ScaledCanvas>
      <ScaledCanvas width={360} height={640} className="md:hidden">
        <PhoneFrame className="absolute inset-x-6 top-2 bottom-2">
          <div className="p-4 text-label-md text-muted-foreground">Guest: {film.scene}</div>
        </PhoneFrame>
      </ScaledCanvas>

      <p aria-live="polite" className="text-center text-headline-md text-foreground md:text-headline-lg-mobile">{current.caption}</p>
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
        <button
          type="button"
          onClick={() => setPaused((v) => !v)}
          aria-label={paused ? "Play the tour" : "Pause the tour"}
          className={cn("flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-foreground shadow-sm hover:text-primary", reduced && "hidden")}
        >
          {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
        </button>
        <ol className="grid flex-1 grid-cols-5 gap-2">
          {SCENES.map((s, i) => (
            <li key={s.id}>
              <button type="button" onClick={() => jump(i)} className="flex w-full flex-col gap-1.5 text-left" aria-current={i === scene ? "step" : undefined}>
                <span className="h-1.5 overflow-hidden rounded-full bg-cream-container">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-secondary-container to-primary"
                    style={{ width: i < scene ? "100%" : i === scene ? `${(reduced ? 1 : p) * 100}%` : "0%" }}
                  />
                </span>
                <span className={cn("text-label-sm", i === scene ? "text-primary" : "text-muted-foreground")}>{s.chapter}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
