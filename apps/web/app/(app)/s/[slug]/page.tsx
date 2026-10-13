import { ListMusic } from "lucide-react";
import type { Metadata } from "next";

import { requireSession } from "@/lib/session";
import { openSpace } from "@/lib/spaces/data";

export async function generateMetadata({ params }: PageProps<"/s/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { user } = await requireSession();
  const opened = await openSpace(slug, user.id);
  return { title: opened && opened.role !== "outsider" ? `${opened.space.name} · Moozer` : "Moozer" };
}

// The queue arrives in the next stage; until then this tab shows its empty state.
export default async function SpaceQueuePage({ params }: PageProps<"/s/[slug]">) {
  const { slug } = await params;
  const { user } = await requireSession();
  const opened = await openSpace(slug, user.id);
  if (!opened || opened.role === "outsider") return null; // the layout shows why

  return (
    <div className="flex flex-col items-center gap-3 rounded-[14px] bg-card p-10 text-center shadow-sm">
      <span className="flex size-10 items-center justify-center rounded-full bg-cream-container text-primary">
        <ListMusic className="size-5" aria-hidden />
      </span>
      <h2 className="text-title-sm text-foreground">No songs yet</h2>
      <p className="max-w-sm text-body-md text-muted-foreground">
        {opened.space.status === "live"
          ? "Songs people add show up here, sorted by votes. The song with the most votes plays next."
          : "Nothing was added before this space ended."}
      </p>
    </div>
  );
}
