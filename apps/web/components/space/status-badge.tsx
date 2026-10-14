import type { SpaceStatus } from "@moozer/protocol/messages";

import { Badge, BadgeDot } from "@/components/ui/badge";

const LABELS: Record<SpaceStatus, string> = { live: "Live", paused: "Paused", scheduled: "Scheduled", ended: "Ended" };

// The pill next to a space's name.
export function SpaceStatusBadge({ status, className }: { status: SpaceStatus; className?: string }) {
  if (status === "live") {
    return (
      <Badge variant="live" className={className}>
        <BadgeDot pulse />
        Live
      </Badge>
    );
  }
  return (
    <Badge variant={status === "ended" ? "ended" : "neutral"} className={className}>
      {LABELS[status]}
    </Badge>
  );
}
