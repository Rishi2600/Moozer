"use client";

import { CircleStop, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { EndSpaceDialog } from "@/components/space/end-space-dialog";
import { Button } from "@/components/ui/button";

export function EndSpaceCard({ space }: { space: { id: string; name: string; members: number } }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="flex flex-col gap-space-md rounded-[14px] border border-destructive/20 bg-destructive/5 p-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-1.5 text-label-md text-destructive">
          <TriangleAlert className="size-4" aria-hidden />
          End this space
        </h2>
        <p className="text-body-md text-muted-foreground">
          Nobody can join, add songs or vote after it ends. You can still find it in Spaces.
        </p>
      </div>
      <Button variant="destructive-outline" onClick={() => setOpen(true)} className="shrink-0 self-start sm:self-auto">
        <CircleStop aria-hidden />
        End space
      </Button>
      <EndSpaceDialog space={space} open={open} onOpenChange={setOpen} />
    </section>
  );
}
