"use client";

import { UserX } from "lucide-react";
import { useState, useTransition } from "react";

import { removePersonAction } from "@/app/(app)/s/[slug]/actions";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type Person = { id: string; name: string };

// Host only. Open while `person` is set; shared by the song menu and "In the room".
export function RemovePersonDialog({ spaceId, person, onClose }: { spaceId: string; person: Person | null; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function remove() {
    if (!person) return;
    setError(null);
    start(async () => {
      const result = await removePersonAction(spaceId, person.id);
      if (result.ok) onClose();
      else setError(result.error);
    });
  }

  return (
    <Dialog
      open={person !== null}
      onOpenChange={(open) => {
        if (open) return;
        setError(null);
        onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove {person?.name} from this space?</DialogTitle>
          <DialogDescription>
            They leave straight away and can&apos;t rejoin from the link or code. Songs they queued and their votes are removed too.
          </DialogDescription>
        </DialogHeader>
        {error && <FormError>{error}</FormError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={remove} disabled={pending}>
            <UserX aria-hidden />
            {pending ? "Removing…" : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
