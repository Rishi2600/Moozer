// Development only: give someone boosts to test with, or show their wallet.
//   npm run boosts -w @moozer/db -- grant maya@example.com 5
//   npm run boosts -w @moozer/db -- show maya@example.com
import { prisma } from "../src/index.ts";

const [command, email, amount] = process.argv.slice(2);

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("This script is for development only.");
  if (!email || (command !== "grant" && command !== "show")) {
    throw new Error("Usage: grant <email> <number> | show <email>");
  }
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true, name: true } });
  if (!user) throw new Error(`No account with the email ${email}.`);
  if (command === "grant") {
    const n = Number(amount);
    if (!Number.isInteger(n) || n < 1 || n > 1000) throw new Error("Grant between 1 and 1000 boosts.");
    await prisma.boostLedger.create({ data: { userId: user.id, delta: n, reason: "grant" } });
    console.log(`Gave ${user.name} ${n} ${n === 1 ? "boost" : "boosts"}.`);
  }
  const sum = await prisma.boostLedger.aggregate({ where: { userId: user.id }, _sum: { delta: true } });
  console.log(`${user.name}'s ledger adds up to ${sum._sum.delta ?? 0} (plus the free one if it's due back).`);
}

main()
  .catch((error: Error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
