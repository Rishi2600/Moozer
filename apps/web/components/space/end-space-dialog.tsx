"use client";

import { Power } from "lucide-react";
import { useState, useTransition } from "react";

import { endSpaceAction } from "@/app/(app)/s/[slug]/settings/actions";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  space: { id: string; name: string; members: number };
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Shared by the Settings danger card and the Spaces home row menu.
export function EndSpaceDialog({ space, open, onOpenChange }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const others = space.members - 1;

  function end() {
    setError(null);
    startTransition(async () => {
      const result = await endSpaceAction(space.id);
      if (result && "error" in result) setError(result.error);
      else onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setError(null); onOpenChange(next); }}>
      <DialogContent onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>End {space.name}?</DialogTitle>
          <DialogDescription>
            {others > 0
              ? `${others} ${others === 1 ? "person" : "people"} will see that the space has ended. Nobody can add songs or vote after this.`
              : "Nobody else has joined yet. Once it ends, nobody can join, add songs or vote."}
          </DialogDescription>
        </DialogHeader>
        {error && <FormError>{error}</FormError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={end} disabled={pending}>
            <Power aria-hidden />
            {pending ? "Ending…" : "End space"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
