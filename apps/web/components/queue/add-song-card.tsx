"use client";

import { useCallback, useState } from "react";

import { Toast } from "@/components/ui/toast";

import { AddSongForm } from "./add-song-form";

// Desktop: "Add a song" lives in the side panel.
export function AddSongCard({ spaceId }: { spaceId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const dismiss = useCallback(() => setMessage(null), []);
  return (
    <section className="flex flex-col gap-space-md rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <h2 className="text-title-sm text-foreground">Add a song</h2>
      <AddSongForm spaceId={spaceId} onDone={setMessage} />
      {message && <Toast message={message} onDismiss={dismiss} />}
    </section>
  );
}
