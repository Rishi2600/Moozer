"use client";

import { Check, CheckCheck } from "lucide-react";
import { useActionState, useState } from "react";

import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SPACE_DESCRIPTION_MAX, SPACE_NAME_MAX } from "@/lib/spaces/codes";

import { saveDetailsAction } from "./actions";

const tidy = (text: string) => text.trim().replace(/\s+/g, " ");

// Name and the optional one-line description.
export function DetailsCard({ spaceId, name, description }: { spaceId: string; name: string; description: string | null }) {
  const [nameValue, setName] = useState(name);
  const [descriptionValue, setDescription] = useState(description ?? "");
  const [state, formAction, pending] = useActionState(saveDetailsAction.bind(null, spaceId), null);
  const changed = tidy(nameValue).length > 0 && (tidy(nameValue) !== name || tidy(descriptionValue) !== (description ?? ""));

  return (
    <Card className="flex flex-col gap-space-md rounded-[14px] p-5">
      <form action={formAction} className="flex flex-col gap-space-md">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="space-name" className="text-label-md text-foreground">Space name</Label>
            <span className="text-body-sm text-faint-foreground tabular-nums">
              {nameValue.length} of {SPACE_NAME_MAX} characters
            </span>
          </div>
          <Input id="space-name" name="name" value={nameValue} maxLength={SPACE_NAME_MAX} required onChange={(e) => setName(e.target.value)} />
          <p className="text-body-sm text-muted-foreground">Everyone in the space sees this name.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="space-description" className="text-label-md text-foreground">
              Description <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <span className="text-body-sm text-faint-foreground tabular-nums">
              {descriptionValue.length} of {SPACE_DESCRIPTION_MAX}
            </span>
          </div>
          <Input
            id="space-description"
            name="description"
            value={descriptionValue}
            maxLength={SPACE_DESCRIPTION_MAX}
            placeholder="Warm house & melodic grooves"
            onChange={(e) => setDescription(e.target.value)}
          />
          <p className="text-body-sm text-muted-foreground">A line about the music, shown on the space&apos;s card and on Discover.</p>
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
