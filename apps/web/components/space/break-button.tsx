"use client";

import { Coffee } from "lucide-react";
import { useTransition } from "react";

import { setBreakAction } from "@/app/(app)/s/[slug]/actions";
import { Button } from "@/components/ui/button";

// Host only, while live: stop the music for a while. Resume is on the banner.
export function BreakButton({ spaceId }: { spaceId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      aria-label="Take a break"
      onClick={() => start(async () => void (await setBreakAction(spaceId, true)))}
    >
      <Coffee aria-hidden />
      <span className="max-sm:hidden">{pending ? "Pausing…" : "Take a break"}</span>
    </Button>
  );
}
