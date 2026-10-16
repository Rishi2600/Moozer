"use client";

import { Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { LocalTime } from "@/components/local-time";
import { BOOST_VOTES } from "@/lib/queue/boost";
import { cn } from "@/lib/utils";

// Asks the server again when the free boost is due back, so the balance
// shown includes it without a reload.
export function useRefreshAt(at: Date | null) {
  const router = useRouter();
  const ms = at?.getTime() ?? null;
  useEffect(() => {
    if (ms === null) return;
    const timer = setTimeout(() => router.refresh(), Math.max(0, ms - Date.now()) + 500);
    return () => clearTimeout(timer);
  }, [ms, router]);
}

export function BoostButton({ title, className, ...props }: React.ComponentProps<"button"> & { title: string }) {
  return (
    <button
      type="button"
      aria-label={`Boost ${title} (+${BOOST_VOTES} votes)`}
      title={`Boost: +${BOOST_VOTES} votes`}
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-xl border border-amber-bright/50 bg-amber-bright/15 text-on-secondary-container transition-transform hover:bg-amber-bright/30 active:scale-[0.94] disabled:opacity-50",
        className
      )}
      {...props}
    >
      <Zap className="size-4 fill-current" aria-hidden />
    </button>
  );
}

// "⚡ +3 Sam" on a boosted song. Re-pops whenever another boost lands.
export function BoostChip({ names, className }: { names: string[]; className?: string }) {
  if (names.length === 0) return null;
  const people = [...new Set(names)]; // someone can stack several boosts
  const firstNames = people.map((n) => n.split(" ")[0]);
  const tally = people
    .map((n) => {
      const times = names.filter((m) => m === n).length;
      return times > 1 ? `${n} ×${times}` : n;
    })
    .join(", ");
  const who = firstNames.length > 2 ? `${firstNames.slice(0, 2).join(", ")} +${firstNames.length - 2}` : firstNames.join(" & ");
  return (
    <span
      key={names.length}
      title={`Boosted by ${tally}`}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-bright/20 px-2 py-0.5 text-label-sm whitespace-nowrap text-on-secondary-container tabular-nums animate-in zoom-in-50 duration-500",
        className
      )}
    >
      <Zap className="size-3 fill-current" aria-hidden />+{names.length * BOOST_VOTES}
      <span className="sr-only">votes from boosts by</span>
      <span className="max-sm:sr-only">{who}</span>
    </span>
  );
}

// Queue header: your boosts, and when the free one is back while it's out.
export function BoostStatus({ balance, nextFreeAt }: { balance: number; nextFreeAt: Date | null }) {
  const count = Math.max(0, balance);
  return (
    <span className="flex items-center gap-1 text-body-sm text-muted-foreground">
      <Zap className={cn("size-4", count > 0 ? "fill-amber-bright text-amber-bright" : "text-faint-foreground")} aria-hidden />
      <span>
        {count > 0 && (
          <span className="text-foreground">
            {count} {count === 1 ? "boost" : "boosts"}
          </span>
        )}
        {count > 0 && nextFreeAt && " · "}
        {nextFreeAt && (
          <>
            {count > 0 ? "next free " : "Free boost back at "}
            <LocalTime date={nextFreeAt} />
          </>
        )}
      </span>
    </span>
  );
}
