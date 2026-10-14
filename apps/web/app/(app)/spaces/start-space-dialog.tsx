"use client";

import { CalendarClock, Plus } from "lucide-react";
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
import { SCHEDULE_MAX_DAYS, toLocalInputValue } from "@/lib/spaces/schedule";

import { startSpace } from "./actions";

// Opening a picker: the next whole hour at least 30 minutes away as a first
// suggestion, and the allowed range (a minute from now to the limit).
function newSchedule() {
  const now = Date.now();
  const suggested = new Date(now + 30 * 60_000);
  suggested.setMinutes(60, 0, 0);
  return {
    value: toLocalInputValue(suggested),
    min: toLocalInputValue(new Date(now + 60_000)),
    max: toLocalInputValue(new Date(now + SCHEDULE_MAX_DAYS * 86_400_000)),
  };
}

export function StartSpaceDialog({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [name, setName] = useState("");
  // The picker's local time and range; null means start now.
  const [schedule, setSchedule] = useState<ReturnType<typeof newSchedule> | null>(null);
  const [state, formAction, pending] = useActionState(startSpace, null);
  const opensAt = schedule?.value ?? null;
  const opensAtIso = opensAt ? new Date(opensAt).toISOString() : "";

  return (
    <Dialog
      defaultOpen={defaultOpen}
      onOpenChange={(open) => {
        if (open) return;
        setName("");
        setSchedule(null);
      }}
    >
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
          {schedule === null ? (
            <button
              type="button"
              onClick={() => setSchedule(newSchedule())}
              className="flex w-fit items-center gap-1.5 text-label-md text-primary underline-offset-4 hover:underline"
            >
              <CalendarClock className="size-4" aria-hidden />
              Schedule for later
            </button>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="space-opens-at" className="text-foreground">Opens at</Label>
                <button type="button" onClick={() => setSchedule(null)} className="text-label-sm text-muted-foreground underline-offset-4 hover:underline">
                  Start now instead
                </button>
              </div>
              <Input
                id="space-opens-at"
                type="datetime-local"
                value={schedule.value}
                onChange={(event) => setSchedule({ ...schedule, value: event.target.value })}
                min={schedule.min}
                max={schedule.max}
                required
                aria-describedby="space-opens-at-hint"
              />
              <input type="hidden" name="scheduledFor" value={opensAtIso} />
              <p id="space-opens-at-hint" className="text-body-sm text-muted-foreground">
                People can join and line up songs before then. It opens by itself at that time.
              </p>
            </div>
          )}
          {state?.error && <FormError>{state.error}</FormError>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={pending || name.trim().length === 0 || (opensAt !== null && !opensAtIso)}>
              {pending ? (opensAt ? "Scheduling…" : "Starting…") : opensAt ? "Schedule space" : "Start space"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
