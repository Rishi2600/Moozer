"use client";

import { Keyboard } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { playNextAction, seekAction, setPausedAction } from "@/app/(app)/s/[slug]/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Toast } from "@/components/ui/toast";
import { describeTarget, HOST_SHORTCUTS, hostShortcut } from "@/lib/shortcuts";

type Props = { spaceId: string; playing: boolean; paused: boolean; queued: number };

// Keyboard control of the host's player, and the "?" list of keys. The same
// actions as the buttons, so every screen follows.
export function HostShortcuts({ spaceId, playing, paused, queued }: Props) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [, start] = useTransition();
  const dismiss = useCallback(() => setError(null), []);
  const latest = useRef({ spaceId, playing, paused, queued });
  useEffect(() => {
    latest.current = { spaceId, playing, paused, queued };
  });

  useEffect(() => {
    function run(action: () => Promise<{ ok: boolean; error?: string }>, done: string) {
      start(async () => {
        const result = await action();
        if (result.ok) setAnnouncement(done);
        else setError(result.error ?? "That didn't work. Try again.");
      });
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      const shortcut = hostShortcut(event, describeTarget(event.target));
      if (!shortcut) return;
      const { spaceId, playing, paused, queued } = latest.current;
      if (shortcut === "help") {
        event.preventDefault();
        setHelpOpen(true);
        return;
      }
      if (shortcut === "next") {
        if (!playing && queued === 0) return;
        event.preventDefault();
        run(() => playNextAction(spaceId), queued > 0 ? "Playing the next song" : "Song finished");
        return;
      }
      if (!playing) return;
      event.preventDefault(); // Space would scroll the page, arrows sideways
      if (shortcut === "toggle") run(() => setPausedAction(spaceId, !paused), paused ? "Playing" : "Paused");
      else run(() => seekAction(spaceId, shortcut === "back" ? -10 : 10), shortcut === "back" ? "Back 10 seconds" : "Forward 10 seconds");
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)" className="max-md:hidden">
            <Keyboard aria-hidden />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keyboard shortcuts</DialogTitle>
            <DialogDescription>For the host, anywhere on this page except while typing.</DialogDescription>
          </DialogHeader>
          <dl className="flex flex-col divide-y divide-border">
            {HOST_SHORTCUTS.map((shortcut) => (
              <div key={shortcut.does} className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-body-md text-foreground">{shortcut.does}</dt>
                <dd className="flex items-center gap-1.5 text-body-sm text-muted-foreground">
                  {shortcut.keys.map((k, i) => (
                    <span key={k} className="flex items-center gap-1.5">
                      {i > 0 && <span aria-hidden>{"together" in shortcut ? "+" : "or"}</span>}
                      <kbd className="min-w-7 font-sans rounded-md border border-border bg-cream-subtle px-2 py-0.5 text-center text-label-md text-foreground">{k}</kbd>
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>
      <span role="status" className="sr-only">{announcement}</span>
      {error && <Toast message={error} onDismiss={dismiss} />}
    </>
  );
}
