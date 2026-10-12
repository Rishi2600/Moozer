import { prisma } from "@moozer/db";
import type { Metadata } from "next";

import { requireSession } from "@/lib/session";
import { describeUserAgent } from "@/lib/user-agent";

import { ProfileCard } from "./profile-card";
import { SessionCard } from "./session-card";

export const metadata: Metadata = { title: "Account · Moozer" };

export default async function AccountPage() {
  const { user, session } = await requireSession();
  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    select: { providerId: true },
  });
  const providers = accounts.map((a) => a.providerId);

  return (
    <div className="flex max-w-[640px] flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-headline-lg-mobile text-foreground md:text-headline-lg">Account</h1>
        <p className="text-body-md text-muted-foreground">Your profile, this session and your account.</p>
      </div>
      <ProfileCard name={user.name} email={user.email} providers={providers} />
      <SessionCard device={describeUserAgent(session.userAgent)} />
    </div>
  );
}
