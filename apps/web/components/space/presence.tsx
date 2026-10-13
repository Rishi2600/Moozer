"use client";

import { Users } from "lucide-react";

import { Avatar } from "@/components/avatar";
import { cn } from "@/lib/utils";

import { useLive } from "./live";

// "18 here" once connected; "N joined" until then (and for ended spaces).
export function HereCount({ joined }: { joined: number }) {
  const { here } = useLive();
  const text = here !== null ? `${here} here` : joined === 1 ? "Just you" : `${joined} joined`;
  return (
    <span className="flex shrink-0 items-center gap-1 whitespace-nowrap tabular-nums">
      <Users className="size-3.5 text-faint-foreground" aria-hidden />
      {text}
    </span>
  );
}

// Overlapping initials, then "+N".
export function PeoplePile({ max, className }: { max: number; className?: string }) {
  const { people } = useLive();
  if (people.length === 0) return null;
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div className={cn("flex items-center", className)}>
      <ul className="flex -space-x-2" aria-label={`In the room: ${people.map((p) => p.name).join(", ")}`}>
        {shown.map((person) => (
          <li key={person.id} title={person.name}>
            <Avatar name={person.name} className="size-8 border-2 border-card" />
          </li>
        ))}
      </ul>
      {extra > 0 && (
        <span className="-ml-2 flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-card bg-primary px-1.5 text-label-sm text-primary-foreground tabular-nums">
          +{extra}
        </span>
      )}
    </div>
  );
}

// Desktop side panel.
export function InTheRoomCard() {
  const { here } = useLive();
  if (here === null) return null;
  return (
    <section className="hidden flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm lg:flex">
      <div className="flex items-center justify-between">
        <h2 className="text-title-sm text-foreground">In the room</h2>
        <span className="text-label-md text-primary tabular-nums">{here} here</span>
      </div>
      <PeoplePile max={8} />
    </section>
  );
}
