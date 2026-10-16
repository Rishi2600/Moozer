// Manage discount codes (works against whichever DATABASE_URL is set, so it
// is also how codes get into production). Codes are never deleted, only
// switched off, so past orders keep pointing at them.
//
//   npm run coupon -w @moozer/db -- create FREELOADER --percent 100 [--packs]
//       [--max 50] [--per-user 1] [--expires 2027-01-31] [--note "team"]
//   npm run coupon -w @moozer/db -- list
//   npm run coupon -w @moozer/db -- off FREELOADER
//   npm run coupon -w @moozer/db -- on FREELOADER
import { prisma } from "../src/index.ts";

const [command, rawCode, ...rest] = process.argv.slice(2);
const code = (rawCode ?? "").replace(/\s+/g, "").toUpperCase();

function option(name: string) {
  const at = rest.indexOf(`--${name}`);
  return at === -1 ? undefined : rest[at + 1];
}
function count(name: string) {
  const value = option(name);
  if (value === undefined) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw new Error(`--${name} must be a whole number above 0.`);
  return n;
}

async function main() {
  if (command === "list") {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "asc" }, include: { _count: { select: { orders: { where: { status: { in: ["paid", "refunded"] } } } } } } });
    if (coupons.length === 0) console.log("No codes yet.");
    for (const c of coupons) {
      const limits = [c.maxRedemptions && `max ${c.maxRedemptions}`, c.perUserLimit && `${c.perUserLimit} per person`, c.expiresAt && `until ${c.expiresAt.toISOString().slice(0, 10)}`].filter(Boolean).join(", ");
      console.log(`${c.code}  ${c.percentOff}% off ${c.appliesTo === "packs" ? "packs" : "everything"}  ${c.active ? "on" : "OFF"}  used ${c._count.orders}${limits ? `  (${limits})` : ""}${c.note ? `  · ${c.note}` : ""}`);
    }
    return;
  }
  if (!/^[A-Z0-9-]{3,32}$/.test(code)) throw new Error("Codes are 3 to 32 letters, digits or dashes.");
  if (command === "create") {
    const percentOff = Number(option("percent"));
    if (!Number.isInteger(percentOff) || percentOff < 1 || percentOff > 100) throw new Error("--percent must be 1 to 100.");
    const expires = option("expires");
    const expiresAt = expires ? new Date(expires) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) throw new Error("--expires must be a date like 2027-01-31.");
    await prisma.coupon.create({
      data: {
        code,
        percentOff,
        appliesTo: rest.includes("--packs") ? "packs" : "all",
        maxRedemptions: count("max"),
        perUserLimit: count("per-user"),
        expiresAt,
        note: option("note") ?? null,
      },
    });
    console.log(`Created ${code}: ${percentOff}% off ${rest.includes("--packs") ? "packs of 3 or 10" : "everything"}.`);
    return;
  }
  if (command === "off" || command === "on") {
    const { count: changed } = await prisma.coupon.updateMany({ where: { code }, data: { active: command === "on" } });
    if (changed === 0) throw new Error(`There's no code ${code}.`);
    console.log(`${code} is ${command === "on" ? "on" : "off"}.`);
    return;
  }
  throw new Error("Usage: create <CODE> --percent <1-100> [options] | list | off <CODE> | on <CODE>");
}

main()
  .catch((error: Error) => {
    console.error(error.message.includes("Unique constraint") ? `${code} already exists.` : error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
