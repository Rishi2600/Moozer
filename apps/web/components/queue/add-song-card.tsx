"use client";

import { useCallback, useState } from "react";

import { useLive } from "@/components/space/live";
import { Toast } from "@/components/ui/toast";

import { AddSongForm } from "./add-song-form";

// Desktop: "Add a song" lives in the side panel (phones use AddSongSheet).
export function AddSongCard({ spaceId }: { spaceId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const dismiss = useCallback(() => setMessage(null), []);
  const offline = useLive().status === "offline";
  return (
    <section inert={offline} data-offline={offline || undefined} className="hidden flex-col gap-space-md rounded-2xl data-offline:opacity-50 lg:flex border border-border/60 bg-card p-5 shadow-sm">
      <h2 className="text-title-sm text-foreground">Add a song</h2>
      <AddSongForm spaceId={spaceId} onDone={setMessage} />
      {message && <Toast message={message} onDismiss={dismiss} />}
    </section>
  );
}
