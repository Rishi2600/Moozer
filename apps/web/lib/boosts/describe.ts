import { formatRupees } from "@/lib/payments/packs";

type Entry = {
  reason: "refill" | "purchase" | "grant" | "spend" | "refund" | "reversal";
  cause: "undo" | "song_removed" | "person_removed" | "space_ended" | "unplayable" | null;
  delta: number;
  songTitle: string | null;
  space: { name: string } | null;
  order: { provider: "razorpay" | "coupon"; amountPaise: number; boosts: number; coupon: { code: string } | null } | null;
};

const plural = (n: number) => `${n} ${n === 1 ? "boost" : "boosts"}`;

// One line of the boost history, in plain words.
export function describeEntry(entry: Entry) {
  const song = entry.songTitle ?? "a song";
  const where = entry.space ? ` in ${entry.space.name}` : "";
  switch (entry.reason) {
    case "refill":
      return "Free boost added";
    case "purchase":
      return entry.order ? `Bought ${plural(entry.order.boosts)} · ${formatRupees(entry.order.amountPaise)}` : `Bought ${plural(entry.delta)}`;
    case "grant":
      return entry.order?.coupon ? `${plural(entry.delta)} with the code ${entry.order.coupon.code}` : `${plural(entry.delta)} from Moozer`;
    case "spend":
      return `Boosted ${song}${where}`;
    case "refund":
      switch (entry.cause) {
        case "undo":
          return `Undid the boost on ${song}`;
        case "person_removed":
          return `Boost on ${song} back after a removal${where}`;
        case "space_ended":
          return entry.space ? `${entry.space.name} ended before ${song} played` : `The space ended before ${song} played`;
        case "unplayable":
          return `${song} couldn't play on YouTube`;
        default:
          return `${song} was removed${where}`;
      }
    case "reversal":
      return entry.order ? `Payment of ${formatRupees(entry.order.amountPaise)} refunded` : "Payment refunded";
  }
}
