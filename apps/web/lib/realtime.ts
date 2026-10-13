import "server-only";

import { prisma } from "@moozer/db";
import { signTicket } from "@moozer/protocol/ticket";

// A 60-second pass to the realtime server for one space. Only for members.
export async function issueRealtimeTicket(user: { id: string; name: string }, spaceId: string) {
  const secret = process.env.REALTIME_SECRET;
  if (!secret) return null; // realtime not configured: pages still work, just not live
  const member = await prisma.spaceMember.findUnique({
    where: { spaceId_userId: { spaceId, userId: user.id } },
    select: { userId: true },
  });
  return member ? signTicket({ userId: user.id, name: user.name, spaceId }, secret) : null;
}
