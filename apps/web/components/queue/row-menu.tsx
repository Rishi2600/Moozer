"use client";

import { MoreVertical, Play, Trash2, UserX } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  title: string;
  canPlay: boolean;
  onPlayNow: () => void;
  onRemove: () => void;
  // Host only, for songs someone else added: remove that person.
  removePerson?: { name: string; onSelect: () => void };
};

// Play now (host, while live), Remove from queue (host, or whoever added the
// song) and Remove <person> from the space (host).
export function RowMenu({ title, canPlay, onPlayNow, onRemove, removePerson }: Props) {
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
        {removePerson && (
          <DropdownMenuItem variant="destructive" onSelect={removePerson.onSelect}>
            <UserX aria-hidden />
            Remove {removePerson.name} from space
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
