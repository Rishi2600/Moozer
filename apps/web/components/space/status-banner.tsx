"use client";

import type { SpaceStatus } from "@moozer/protocol/messages";
import { CalendarClock, Coffee, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { openNowAction, setBreakAction } from "@/app/(app)/s/[slug]/actions";
import { FormError } from "@/components/auth/form-error";
import { OpensAt } from "@/components/local-time";
import { Button } from "@/components/ui/button";

type Props = { spaceId: string; status: SpaceStatus; isHost: boolean; hostName: string; scheduledFor: Date | null };

// Under the space header while it's on a break or not open yet.
export function StatusBanner({ spaceId, status, isHost, hostName, scheduledFor }: Props) {
  if (status === "paused") {
    return (
      <Banner icon={<Coffee aria-hidden />} action={isHost && <HostAction label="Resume" pendingLabel="Resuming…" run={() => setBreakAction(spaceId, false)} />}>
        {isHost
          ? "You're on a break. The music stopped where it was; people can still add songs and vote."
          : `${hostName} is taking a break. Add songs and vote meanwhile; the music carries on when they're back.`}
      </Banner>
    );
  }
  if (status === "scheduled" && scheduledFor) {
    return (
      <Banner icon={<CalendarClock aria-hidden />} action={isHost && <HostAction label="Open now" pendingLabel="Opening…" run={() => openNowAction(spaceId)} />}>
        <OpenWhenDue at={scheduledFor} />
        Opens <OpensAt date={scheduledFor} />.{" "}
        {isHost ? "People can join and line up songs now." : "Line up songs and vote meanwhile; the music starts after that."}
      </Banner>
    );
  }
  return null;
}

function Banner({ icon, action, children }: { icon: React.ReactNode; action: React.ReactNode; children: React.ReactNode }) {
  return (
    <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl border border-border-strong/60 bg-cream-container px-4 py-3 text-label-md text-foreground [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-primary">
      {icon}
      <span className="min-w-0 flex-1">{children}</span>
      {action}
    </div>
  );
}

function HostAction({ label, pendingLabel, run }: { label: string; pendingLabel: string; run: () => Promise<{ ok: boolean; error?: string }> }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await run();
            setError(result.ok ? null : (result.error ?? "Something went wrong."));
          })
        }
      >
        <Play aria-hidden />
        {pending ? pendingLabel : label}
      </Button>
      {error && <FormError>{error}</FormError>}
    </span>
  );
}

// At the opening time, re-render: the server opens the space on read, and the
// realtime server then tells every other open screen.
function OpenWhenDue({ at }: { at: Date }) {
  const router = useRouter();
  useEffect(() => {
    const delay = at.getTime() - Date.now() + 500;
    if (delay > 2 ** 31 - 1) return; // over ~24 days away: the page will have reloaded by then
    const timer = setTimeout(() => router.refresh(), Math.max(0, delay));
    return () => clearTimeout(timer);
  }, [at, router]);
  return null;
}
