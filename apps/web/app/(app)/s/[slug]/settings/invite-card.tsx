"use client";

import { Check, Copy, Globe, RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";

import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { resetLinkAction } from "./actions";

export function InviteCard({ spaceId, link, code }: { spaceId: string; link: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetting, startReset] = useTransition();

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setError(null);
    startReset(async () => {
      const result = await resetLinkAction(spaceId);
      if (result && "error" in result) setError(result.error);
    });
  }

  return (
    <Card className="flex flex-col gap-space-md rounded-[14px] p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-label-md text-foreground">Invite link</h2>
        <span className="flex items-center gap-1 text-body-sm text-success">
          <Globe className="size-3.5" aria-hidden />
          Anyone with the link can join
        </span>
      </div>
      <div className="flex flex-col gap-space-sm sm:flex-row">
        <Input value={link} readOnly aria-label="Invite link" className="bg-cream-subtle text-muted-foreground" onFocus={(e) => e.target.select()} />
        <Button variant="secondary" onClick={copy} className="h-11 shrink-0">
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>
      <p className="text-body-sm text-muted-foreground">
        Join code <span className="font-semibold tracking-wider text-foreground tabular-nums">{code}</span>, for typing in from a
        TV or projector.
      </p>
      <div className="flex flex-col gap-space-sm border-t border-border pt-space-md sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body-sm text-muted-foreground">
          Resetting stops the old link and code from working right away. People already in the space stay in.
        </p>
        <Button variant="outline" onClick={reset} disabled={resetting} className="shrink-0">
          <RotateCcw aria-hidden />
          {resetting ? "Resetting…" : "Reset link"}
        </Button>
      </div>
      {error && <FormError>{error}</FormError>}
    </Card>
  );
}
