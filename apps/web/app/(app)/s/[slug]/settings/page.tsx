import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getOrigin } from "@/lib/origin";
import { timeAgo } from "@/lib/relative-time";
import { requireSession } from "@/lib/session";
import { formatJoinCode } from "@/lib/spaces/codes";
import { openSpace } from "@/lib/spaces/data";

import { EndSpaceCard } from "./end-space-card";
import { InviteCard } from "./invite-card";
import { NameCard } from "./name-card";

export const metadata: Metadata = { title: "Space settings · Moozer" };

export default async function SpaceSettingsPage({ params }: PageProps<"/s/[slug]/settings">) {
  const { slug } = await params;
  const { user } = await requireSession();
  const opened = await openSpace(slug, user.id);
  if (!opened || opened.role === "outsider") return null; // the layout explains
  if (opened.role !== "host") redirect(`/s/${slug}`);
  const { space } = opened;

  if (space.status === "ended") {
    return (
      <p className="max-w-[640px] rounded-[14px] bg-card p-5 text-body-md text-muted-foreground shadow-sm">
        This space ended {space.endedAt ? timeAgo(space.endedAt) : ""}. Its name and link can&apos;t be changed any more.
      </p>
    );
  }

  return (
    <div className="flex max-w-[640px] flex-col gap-5">
      <NameCard spaceId={space.id} name={space.name} />
      <InviteCard spaceId={space.id} link={`${await getOrigin()}/s/${space.slug}`} code={formatJoinCode(space.joinCode)} />
      <EndSpaceCard space={{ id: space.id, name: space.name, members: space._count.members }} />
    </div>
  );
}
