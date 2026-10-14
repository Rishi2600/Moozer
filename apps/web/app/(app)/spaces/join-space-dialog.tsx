"use client";

import { Link2 } from "lucide-react";
import { useActionState, useState } from "react";

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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { joinSpace } from "./actions";

// `action` lets the landing page use a version that works signed out.
export function JoinSpaceDialog({ action = joinSpace, size }: { action?: typeof joinSpace; size?: "default" | "lg" }) {
  // Controlled so the text survives React's form reset after an error.
  const [target, setTarget] = useState("");
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <Dialog onOpenChange={(open) => !open && setTarget("")}>
      <DialogTrigger asChild>
        <Button variant="secondary" size={size}>
          <Link2 aria-hidden />
          Join with a link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join with a link</DialogTitle>
          <DialogDescription>Paste a space link, or type the 6-character code from the host&apos;s screen.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-space-md">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="join-target" className="text-foreground">Link or code</Label>
            <Input
              id="join-target"
              name="target"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              placeholder="moozer.app/s/… or K7M-2QX"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              required
              autoFocus
              aria-invalid={state?.error ? true : undefined}
            />
          </div>
          {state?.error && <FormError>{state.error}</FormError>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Joining…" : "Join space"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
