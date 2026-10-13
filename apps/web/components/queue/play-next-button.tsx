"use client";

import { SkipForward } from "lucide-react";
import { useState, useTransition } from "react";

import { playNextAction } from "@/app/(app)/s/[slug]/actions";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";

export function PlayNextButton({ spaceId, playing, queued }: { spaceId: string; playing: boolean; queued: number }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (!playing && queued === 0) return null;

  function play() {
    setError(null);
    start(async () => {
      const result = await playNextAction(spaceId);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button onClick={play} disabled={pending} className="shrink-0">
        <SkipForward aria-hidden />
        {pending ? "Starting…" : playing ? (queued > 0 ? "Play next" : "Finish song") : "Play the top song"}
      </Button>
      {error && <FormError>{error}</FormError>}
    </div>
  );
}
