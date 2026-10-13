import type { Metadata } from "next";

import { listHostedSpaces, listJoinedSpaces } from "@/lib/spaces/data";
import { requireSession } from "@/lib/session";

import { SpaceRow, SpaceSection } from "./space-list";
import { SpacesEmpty } from "./spaces-empty";
import { StartSpaceDialog } from "./start-space-dialog";

export const metadata: Metadata = { title: "Spaces · Moozer" };

export default async function SpacesPage() {
  const { user } = await requireSession();
  const [hosted, joined] = await Promise.all([listHostedSpaces(user.id), listJoinedSpaces(user.id)]);

  return (
    <div className="flex max-w-page flex-col gap-space-lg">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-headline-lg-mobile text-foreground md:text-headline-lg">Spaces</h1>
          <p className="text-body-md text-muted-foreground">Rooms you host and rooms you&apos;ve joined.</p>
        </div>
        <div className="flex gap-space-sm">
          <StartSpaceDialog />
        </div>
      </div>

      {hosted.length === 0 && joined.length === 0 ? (
        <SpacesEmpty actions={<StartSpaceDialog />} />
      ) : (
        <div className="flex flex-col gap-8">
          {hosted.length > 0 && (
            <SpaceSection title="Hosted by you" count={hosted.length}>
              {hosted.map((space) => (
                <SpaceRow key={space.id} space={space} />
              ))}
            </SpaceSection>
          )}
          {joined.length > 0 && (
            <SpaceSection title="Joined recently" count={joined.length}>
              {joined.map((space) => (
                <SpaceRow key={space.id} space={space} />
              ))}
            </SpaceSection>
          )}
        </div>
      )}
    </div>
  );
}
