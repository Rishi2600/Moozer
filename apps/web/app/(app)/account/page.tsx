import { prisma } from "@moozer/db";
import type { Metadata } from "next";

import { getWallet, getWalletHistory } from "@/lib/boosts/wallet";
import { isSessionFresh, requireSession } from "@/lib/session";
import { describeUserAgent } from "@/lib/user-agent";

import { BoostsCard } from "./boosts-card";
import { DeleteAccountCard } from "./delete-account-card";
import { ProfileCard } from "./profile-card";
import { SessionCard } from "./session-card";

export const metadata: Metadata = { title: "Account · Moozer" };

export default async function AccountPage() {
  const { user, session } = await requireSession();
  const [accounts, wallet, history] = await Promise.all([
    prisma.account.findMany({ where: { userId: user.id }, select: { providerId: true } }),
    getWallet(user.id),
    getWalletHistory(user.id),
  ]);
  const providers = accounts.map((a) => a.providerId);

  return (
    <div className="flex max-w-[640px] flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-headline-lg-mobile text-foreground md:text-headline-lg">Account</h1>
        <p className="text-body-md text-muted-foreground">Your profile, your boosts, this session and your account.</p>
      </div>
      <ProfileCard name={user.name} email={user.email} providers={providers} />
      <BoostsCard balance={wallet.balance} nextFreeAt={wallet.nextFreeAt} history={history} />
      <SessionCard device={describeUserAgent(session.userAgent)} />
      <DeleteAccountCard hasPassword={providers.includes("credential")} sessionIsFresh={isSessionFresh(session.createdAt)} boosts={Math.max(0, wallet.balance)} />
    </div>
  );
}
