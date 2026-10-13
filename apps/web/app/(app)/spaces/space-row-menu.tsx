"use client";

import { CircleStop, Copy, MoreHorizontal } from "lucide-react";
import { useState } from "react";

import { EndSpaceDialog } from "@/components/space/end-space-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = { space: { id: string; name: string; slug: string; status: "live" | "ended"; _count: { members: number } } };

export function SpaceRowMenu({ space }: Props) {
  const [ending, setEnding] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`More actions for ${space.name}`}
          className="flex size-8 items-center justify-center rounded-[10px] text-muted-foreground hover:bg-surface-container-high hover:text-foreground"
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => navigator.clipboard.writeText(`${window.location.origin}/s/${space.slug}`)}>
            <Copy aria-hidden />
            Copy link
          </DropdownMenuItem>
          {space.status === "live" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setEnding(true)}>
                <CircleStop aria-hidden />
                End space
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <EndSpaceDialog
        space={{ id: space.id, name: space.name, members: space._count.members }}
        open={ending}
        onOpenChange={setEnding}
      />
    </>
  );
}
