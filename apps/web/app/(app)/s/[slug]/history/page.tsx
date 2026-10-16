import { ChevronLeft, ChevronRight, History } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Avatar } from "@/components/avatar";
import { LocalTime } from "@/components/local-time";
import { Dedication } from "@/components/queue/dedication";
import { SongThumb } from "@/components/queue/song-thumb";
import { HISTORY_PAGE_SIZE, getHistory } from "@/lib/queue/data";
import { requireSession } from "@/lib/session";
import { formatDuration } from "@/lib/songs/links";
import { inSpace, openSpace } from "@/lib/spaces/data";
import { cn } from "@/lib/utils";

import { RequeueButton } from "./requeue-button";

export const metadata: Metadata = { title: "Played tonight · Moozer" };

export default async function HistoryPage({ params, searchParams }: PageProps<"/s/[slug]/history">) {
  const { slug } = await params;
  const { page: rawPage } = await searchParams;
  const { user } = await requireSession();
  const opened = await openSpace(slug, user.id);
  if (!inSpace(opened)) return null; // the layout explains
  const page = Math.max(1, Number.parseInt(String(rawPage ?? "1"), 10) || 1);
  const history = await getHistory(opened.space.id, user.id, page);
  if (!history) return null;
  const canRequeue = opened.space.status !== "ended";
  const first = (page - 1) * HISTORY_PAGE_SIZE + 1;

  return (
    <section className="flex flex-col gap-space-md">
      <h2 className="flex items-baseline gap-3 text-headline-lg-mobile text-foreground md:text-headline-lg">
        Played tonight
        <span className="text-body-lg text-muted-foreground tabular-nums">
          {history.total} {history.total === 1 ? "song" : "songs"}
        </span>
      </h2>
      {history.total === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-card p-10 text-center shadow-sm">
          <span className="flex size-10 items-center justify-center rounded-full bg-cream-container text-primary">
            <History className="size-5" aria-hidden />
          </span>
          <p className="text-title-sm text-foreground">Nothing has played yet</p>
          <p className="text-body-md text-muted-foreground">Songs show up here once the host plays them.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
          <table className="w-full text-left">
            <thead className="border-b border-border/60 text-label-sm tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Song</th>
                <th scope="col" className="hidden px-3 py-3 font-semibold md:table-cell">Added by</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">Votes</th>
                <th scope="col" className="hidden px-3 py-3 text-right font-semibold sm:table-cell">Played at</th>
                <th scope="col" className="w-12 px-3 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {history.items.map((item, index) => (
                <tr key={item.id} className="hover:bg-cream-surface/70">
                  <td className="px-5 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <SongThumb src={item.thumbnailUrl} className="w-20" sizes="80px" />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-body-md font-semibold text-foreground">{item.title}</span>
                        <span className="truncate text-body-sm text-muted-foreground">
                          {[item.channel, item.durationSeconds !== null ? formatDuration(item.durationSeconds) : null].filter(Boolean).join(" · ")}
                        </span>
                        <Dedication text={item.dedication} className="text-body-sm" />
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 md:table-cell">
                    <span className="flex items-center gap-2 text-body-md text-foreground">
                      <Avatar name={item.addedBy.name} className="size-7 text-label-sm" />
                      {item.addedBy.name}
                    </span>
                  </td>
                  <td className={cn("px-3 py-3 text-right text-label-md tabular-nums", page === 1 && index === 0 ? "text-primary" : "text-foreground")}>
                    {item.finalVotes}
                  </td>
                  <td className="hidden px-3 py-3 text-right text-body-md text-foreground sm:table-cell">
                    {item.startedAt && <LocalTime date={item.startedAt} />}
                  </td>
                  <td className="px-3 py-3">{canRequeue && <RequeueButton itemId={item.id} title={item.title} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-border/60 px-5 py-3 text-body-sm text-muted-foreground">
            <span className="tabular-nums">
              Showing {first}–{first + history.items.length - 1} of {history.total} played songs
            </span>
            <span className="flex items-center gap-2">
              <span className="tabular-nums">Page {page} of {history.pages}</span>
              <PageLink href={`?page=${page - 1}`} disabled={page <= 1} label="Previous page"><ChevronLeft className="size-4" /></PageLink>
              <PageLink href={`?page=${page + 1}`} disabled={page >= history.pages} label="Next page"><ChevronRight className="size-4" /></PageLink>
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

function PageLink({ href, disabled, label, children }: { href: string; disabled: boolean; label: string; children: React.ReactNode }) {
  const style = "flex size-8 items-center justify-center rounded-full border border-border bg-card";
  return disabled ? (
    <span aria-disabled className={cn(style, "opacity-40")}>{children}</span>
  ) : (
    <Link href={href} aria-label={label} className={cn(style, "hover:bg-muted")}>{children}</Link>
  );
}
