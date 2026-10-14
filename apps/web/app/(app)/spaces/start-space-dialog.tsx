"use client";

import { Plus } from "lucide-react";
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
import { SPACE_NAME_MAX } from "@/lib/spaces/codes";

import { startSpace } from "./actions";

export function StartSpaceDialog({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [name, setName] = useState("");
  const [state, formAction, pending] = useActionState(startSpace, null);

  return (
    <Dialog defaultOpen={defaultOpen} onOpenChange={(open) => !open && setName("")}>
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden />
          Start a space
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a space</DialogTitle>
          <DialogDescription>Give it a name people will recognise. You can change it later.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-space-md">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="space-name" className="text-foreground">Space name</Label>
            <Input
              id="space-name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={SPACE_NAME_MAX}
              placeholder="Friday at the studio"
              autoComplete="off"
              required
              autoFocus
              aria-describedby="space-name-count"
            />
            <p id="space-name-count" className="text-right text-body-sm text-faint-foreground tabular-nums">
              {name.length} of {SPACE_NAME_MAX} characters
            </p>
          </div>
          {state?.error && <FormError>{state.error}</FormError>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={pending || name.trim().length === 0}>
              {pending ? "Starting…" : "Start space"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
