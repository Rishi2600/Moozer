"use client";

import type { Device, Speaker } from "@moozer/protocol/messages";
import { Laptop, Smartphone, Tv, Volume2 } from "lucide-react";
import { useState, useTransition } from "react";

import { approveSpeakerAction, revokeSpeakerAction } from "@/app/(app)/s/[slug]/actions";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { clockOffset } from "@/lib/clock";
import { useNow } from "@/lib/use-now";

import { useLive } from "./live";

const DEVICE: Record<Device, { label: string; Icon: typeof Laptop }> = {
  laptop: { label: "Laptop", Icon: Laptop },
  phone: { label: "Phone", Icon: Smartphone },
  tv: { label: "TV", Icon: Tv },
};

// The host's screens: guests asking to play the music on their own device.
// Up to three prompts show; the rest wait their turn.
export function SpeakerRequests({ spaceId }: { spaceId: string }) {
  const { speakerRequests, answerSpeaker } = useLive();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (speakerRequests.length === 0 && !error) return null;
  const shown = speakerRequests.slice(0, 3);
  const more = speakerRequests.length - shown.length;
  const allow = (userId: string) =>
    start(async () => {
      const result = await approveSpeakerAction(spaceId, userId);
      if (result.ok) answerSpeaker(userId, true);
      else setError(result.error);
    });
  return (
    <>
      <div
        className="fixed z-50 flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col gap-2"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 1rem)", right: "calc(env(safe-area-inset-right, 0px) + 1rem)" }}
        role="region"
        aria-label="Speaker requests"
      >
        {shown.map((request) => (
          <div key={request.id} className="flex flex-col gap-3 rounded-2xl border border-border-strong bg-card p-4 shadow-lg" role="alert">
            <div className="flex items-start gap-3">
              <Avatar name={request.name} className="size-9" />
              <p className="text-body-md text-foreground">
                <span className="font-semibold">{request.name}</span> wants to play the music on their speaker too.
              </p>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" disabled={pending} onClick={() => allow(request.id)}>
                Allow
              </Button>
              <Button variant="outline" className="flex-1" disabled={pending} onClick={() => answerSpeaker(request.id, false)}>
                Not now
              </Button>
            </div>
            <TimeLeft expiresAt={request.expiresAt} />
          </div>
        ))}
        {more > 0 && <p className="rounded-xl bg-muted px-3 py-2 text-body-sm text-muted-foreground">{more === 1 ? "1 more person asked" : `${more} more people asked`}</p>}
      </div>
      {error && <Toast message={error} onDismiss={() => setError(null)} />}
    </>
  );
}

function TimeLeft({ expiresAt }: { expiresAt: number }) {
  const now = useNow(500);
  const left = now === null ? 1 : Math.max(0, (expiresAt - (now + (clockOffset() ?? 0))) / 60_000);
  return (
    <div className="h-1 overflow-hidden rounded-full bg-cream-container" aria-hidden>
      <div className="h-full rounded-full bg-primary transition-[width] duration-500 ease-linear" style={{ width: `${Math.min(1, left) * 100}%` }} />
    </div>
  );
}

// Host's side panel: every screen playing the music, and approved guests
// (playing or not) with Turn off.
export function SpeakersCard({ spaceId, approved }: { spaceId: string; approved: { id: string; name: string }[] }) {
  const { speakers } = useLive();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const hostScreens = speakers.filter((s) => s.host);
  const guests = approved.map((person) => ({ person, playing: speakers.filter((s) => !s.host && s.id === person.id) }));
  if (approved.length === 0 && speakers.every((s) => s.host)) return null;
  const count = speakers.length;
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-title-sm text-foreground">Speakers</h2>
        <span className="flex items-center gap-1 text-label-md text-primary tabular-nums">
          <Volume2 className="size-4" aria-hidden />
          {count} playing
        </span>
      </div>
      <ul className="flex flex-col divide-y divide-border/60">
        {hostScreens.map((screen) => (
          <SpeakerRow key={`${screen.id}:${screen.device}`} name="You" detail={DEVICE[screen.device].label} device={screen.device} />
        ))}
        {guests.map(({ person, playing }) => (
          <SpeakerRow
            key={person.id}
            name={person.name}
            detail={playing.length ? playing.map((s: Speaker) => DEVICE[s.device].label).join(" · ") : "Allowed · not playing"}
            device={playing[0]?.device}
            action={
              <Button
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const result = await revokeSpeakerAction(spaceId, person.id);
                    if (!result.ok) setError(result.error);
                  })
                }
              >
                Turn off
              </Button>
            }
          />
        ))}
      </ul>
      <p className="text-body-sm text-muted-foreground">Turning someone off means they&apos;d have to ask again.</p>
      {error && <Toast message={error} onDismiss={() => setError(null)} />}
    </section>
  );
}

function SpeakerRow({ name, detail, device, action }: { name: string; detail: string; device?: Device; action?: React.ReactNode }) {
  const Icon = device ? DEVICE[device].Icon : null;
  return (
    <li className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
      <Avatar name={name} className="size-8" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-label-md text-foreground">{name}</span>
        <span className="flex items-center gap-1 text-body-sm text-muted-foreground">
          {Icon && <Icon className="size-3.5" aria-hidden />}
          {detail}
        </span>
      </div>
      {action}
    </li>
  );
}
