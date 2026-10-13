"use client";

import { MoreVertical, Play, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Play now (host) and Remove from queue (host, or whoever added the song).
export function RowMenu({ title, canPlay, onPlayNow, onRemove }: { title: string; canPlay: boolean; onPlayNow: () => void; onRemove: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`More actions for ${title}`}
        className="flex size-8 shrink-0 items-center justify-center rounded-[10px] text-muted-foreground hover:bg-surface-container-high hover:text-foreground"
      >
        <MoreVertical className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canPlay && (
          <>
            <DropdownMenuItem onSelect={onPlayNow}>
              <Play aria-hidden />
              Play now
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem variant="destructive" onSelect={onRemove}>
          <Trash2 aria-hidden />
          Remove from queue
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
