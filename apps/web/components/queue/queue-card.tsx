import { ArrowDownWideNarrow, ListMusic } from "lucide-react";

// "Up next" card; rows are rendered by the caller. `status` (the viewer's
// boost) takes the place of "Sorted by votes" on phones.
export function QueueCard({ count, status, children }: { count: number; status?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
        <h2 className="flex items-center gap-2 text-label-md text-foreground">
          Up next
          <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-sm text-orange-deep tabular-nums">
            {count} {count === 1 ? "song" : "songs"}
          </span>
        </h2>
        <span className="flex items-center gap-4">
          <span className={status ? "flex items-center gap-1 text-body-sm text-muted-foreground max-sm:hidden" : "flex items-center gap-1 text-body-sm text-muted-foreground"}>
            <ArrowDownWideNarrow className="size-4 text-primary" aria-hidden />
            Sorted by votes
          </span>
          {status}
        </span>
      </div>
      {count === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-cream-container text-primary">
            <ListMusic className="size-5" aria-hidden />
          </span>
          <p className="text-title-sm text-foreground">No songs yet</p>
          <p className="max-w-sm text-body-md text-muted-foreground">
            Paste a YouTube link to add the first one. The song with the most votes plays next.
          </p>
        </div>
      ) : (
        <ol className="flex flex-col divide-y divide-border/60">{children}</ol>
      )}
    </section>
  );
}
