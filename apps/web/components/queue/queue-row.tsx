import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/songs/links";
import { cn } from "@/lib/utils";

import { SongThumb } from "./song-thumb";

export type QueueRowItem = {
  id: string;
  title: string;
  thumbnailUrl: string;
  durationSeconds: number | null;
  votes: number;
  hasVoted: boolean;
  addedBy: { name: string };
};

// One ballot line: count, vote control, thumbnail, title, who added it.
// The vote control and row menu are passed in so this stays presentational.
export function QueueRow({
  item,
  leadBy,
  vote,
  menu,
}: {
  item: QueueRowItem;
  leadBy?: number | null;
  vote: React.ReactNode;
  menu?: React.ReactNode;
}) {
  const isLeader = leadBy !== undefined;
  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className={cn(
          "w-8 shrink-0 text-right text-counter-ballot tabular-nums",
          item.hasVoted ? "text-primary" : "text-foreground"
        )}
      >
        {item.votes}
      </span>
      {vote}
      <SongThumb src={item.thumbnailUrl} className="w-16 sm:w-20" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {isLeader && (
          <span className="flex items-center gap-2">
            <Badge variant="next" className="border border-border bg-cream-container text-orange-deep">Plays next</Badge>
            {leadBy && <span className="whitespace-nowrap text-body-sm text-muted-foreground tabular-nums">Leads by {leadBy}</span>}
          </span>
        )}
        <span className="truncate text-body-md font-semibold text-foreground">{item.title}</span>
        <span className="flex min-w-0 items-center gap-2 text-body-sm text-muted-foreground">
          <span className="truncate">Added by {item.addedBy.name}</span>
          {item.durationSeconds !== null && <span className="tabular-nums">{formatDuration(item.durationSeconds)}</span>}
        </span>
      </div>
      <Badge variant="neutral" className="hidden rounded-md sm:inline-flex">YouTube</Badge>
      {menu}
    </li>
  );
}
