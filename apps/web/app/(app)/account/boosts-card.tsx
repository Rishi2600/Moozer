import { Zap } from "lucide-react";

import { GetBoostsDialog } from "@/components/boosts/get-boosts-dialog";
import { LocalDateTime, LocalTime } from "@/components/local-time";
import { Card } from "@/components/ui/card";
import { describeEntry } from "@/lib/boosts/describe";
import { HISTORY_SIZE, type WalletEntry } from "@/lib/boosts/wallet";
import { cn } from "@/lib/utils";

type Props = { balance: number; nextFreeAt: Date | null; history: WalletEntry[] };

// Your boosts: how many, when the free one is back, buying more, and what
// happened to them lately.
export function BoostsCard({ balance, nextFreeAt, history }: Props) {
  const count = Math.max(0, balance);
  return (
    <Card className="flex flex-col gap-space-md rounded-[14px] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-label-md text-foreground">Boosts</h2>
          <p className="flex items-center gap-2 text-headline-md text-foreground tabular-nums">
            <Zap className="size-5 fill-amber-bright text-amber-bright" aria-hidden />
            {count} {count === 1 ? "boost" : "boosts"}
          </p>
          <p className="text-body-sm text-muted-foreground">
            {nextFreeAt ? (
              <>
                Your free boost is back at <LocalTime date={nextFreeAt} />.
              </>
            ) : (
              "Includes your free boost. It comes back 5.5 hours after you use it."
            )}{" "}
            Bought boosts never expire.
          </p>
          {balance < 0 && <p className="text-body-sm text-destructive">A refunded payment took back boosts you&apos;d used, so boosting is paused until you&apos;re above zero.</p>}
        </div>
        <div className="self-start">
          <GetBoostsDialog />
        </div>
      </div>

      {history.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border/60 pt-4">
          <h3 className="text-label-md text-foreground">History</h3>
          <ul className="flex flex-col divide-y divide-border/60">
            {history.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body-md text-foreground">{describeEntry(entry)}</span>
                  <span className="text-body-sm text-muted-foreground">
                    <LocalDateTime date={entry.createdAt} />
                  </span>
                </span>
                <span className={cn("text-label-md tabular-nums", entry.delta > 0 ? "text-success" : "text-muted-foreground")}>
                  {entry.delta > 0 ? `+${entry.delta}` : `−${-entry.delta}`}
                </span>
              </li>
            ))}
          </ul>
          {history.length === HISTORY_SIZE && <p className="text-body-sm text-muted-foreground">Showing your latest {HISTORY_SIZE}.</p>}
        </div>
      )}
    </Card>
  );
}
