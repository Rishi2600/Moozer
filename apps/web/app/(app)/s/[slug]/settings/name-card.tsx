"use client";

import { Check, CheckCheck } from "lucide-react";
import { useActionState, useState } from "react";

import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SPACE_NAME_MAX } from "@/lib/spaces/codes";

import { renameSpaceAction } from "./actions";

export function NameCard({ spaceId, name }: { spaceId: string; name: string }) {
  const [value, setValue] = useState(name);
  const [state, formAction, pending] = useActionState(renameSpaceAction.bind(null, spaceId), null);
  const changed = value.trim().replace(/\s+/g, " ") !== name && value.trim().length > 0;

  return (
    <Card className="flex flex-col gap-space-md rounded-[14px] p-5">
      <form action={formAction} className="flex flex-col gap-space-md">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="space-name" className="text-label-md text-foreground">Space name</Label>
            <span className="text-body-sm text-faint-foreground tabular-nums">
              {value.length} of {SPACE_NAME_MAX} characters
            </span>
          </div>
          <Input id="space-name" name="name" value={value} maxLength={SPACE_NAME_MAX} required onChange={(e) => setValue(e.target.value)} />
          <p className="text-body-sm text-muted-foreground">Everyone in the space sees this name.</p>
        </div>
        {state && "error" in state && <FormError>{state.error}</FormError>}
        <div className="flex items-center justify-end gap-space-md">
          {state && "saved" in state && !changed && (
            <span role="status" className="flex items-center gap-1 text-body-sm text-success">
              <CheckCheck className="size-3.5" aria-hidden />
              Saved
            </span>
          )}
          <Button type="submit" disabled={!changed || pending}>
            <Check aria-hidden />
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
