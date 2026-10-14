"use client";

import { Compass } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";

import { FormError } from "@/components/auth/form-error";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

import { setPublicAction } from "./actions";

// Public spaces are listed on Discover; private ones only open from the link or code.
export function DiscoverCard({ spaceId, isPublic }: { spaceId: string; isPublic: boolean }) {
  const [shown, setShown] = useOptimistic(isPublic);
  const [, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(next: boolean) {
    setError(null);
    start(async () => {
      setShown(next);
      const result = await setPublicAction(spaceId, next);
      if (result && "error" in result) setError(result.error);
    });
  }

  return (
    <Card className="flex flex-col gap-3 rounded-[14px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="discover-label" className="flex items-center gap-1.5 text-label-md text-foreground">
            <Compass className="size-4 text-primary" aria-hidden />
            List on Discover
          </h2>
          <p id="discover-hint" className="text-body-md text-muted-foreground">
            {shown
              ? "Anyone can find this space on Discover and tune in. Turn it off to keep it invite-only."
              : "Only people with the link or code can join. Turn it on to let anyone find it on Discover."}
          </p>
        </div>
        <Switch checked={shown} onCheckedChange={toggle} aria-labelledby="discover-label" aria-describedby="discover-hint" />
      </div>
      {error && <FormError>{error}</FormError>}
    </Card>
  );
}
