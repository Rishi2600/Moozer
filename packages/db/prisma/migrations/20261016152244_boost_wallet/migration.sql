-- CreateEnum
CREATE TYPE "LedgerReason" AS ENUM ('refill', 'purchase', 'grant', 'spend', 'refund', 'reversal');

-- CreateEnum
CREATE TYPE "RefundCause" AS ENUM ('undo', 'song_removed', 'person_removed', 'space_ended', 'unplayable');

-- AlterTable
ALTER TABLE "boost" ADD COLUMN     "settled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "boost_ledger" (
    "id" TEXT NOT NULL,
    "seq" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" "LedgerReason" NOT NULL,
    "usedFree" BOOLEAN NOT NULL DEFAULT false,
    "cause" "RefundCause",
    "boostId" TEXT,
    "spaceId" TEXT,
    "songTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boost_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "boost_ledger_userId_seq_idx" ON "boost_ledger"("userId", "seq");

-- CreateIndex
CREATE INDEX "boost_ledger_spaceId_idx" ON "boost_ledger"("spaceId");

-- AddForeignKey
ALTER TABLE "boost_ledger" ADD CONSTRAINT "boost_ledger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boost_ledger" ADD CONSTRAINT "boost_ledger_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "space"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Each reason moves the balance the right way; causes only on refunds; the
-- free flag only on spends and refunds; one spend and at most one refund per boost.
ALTER TABLE "boost_ledger" ADD CONSTRAINT "boost_ledger_delta_matches_reason" CHECK (
  ("reason" IN ('refill', 'refund') AND "delta" = 1)
  OR ("reason" = 'spend' AND "delta" = -1)
  OR ("reason" IN ('purchase', 'grant') AND "delta" > 0)
  OR ("reason" = 'reversal' AND "delta" < 0)
);
ALTER TABLE "boost_ledger" ADD CONSTRAINT "boost_ledger_cause_only_on_refunds" CHECK (("reason" = 'refund') = ("cause" IS NOT NULL));
ALTER TABLE "boost_ledger" ADD CONSTRAINT "boost_ledger_used_free_on_spends" CHECK (NOT "usedFree" OR "reason" IN ('spend', 'refund'));
ALTER TABLE "boost_ledger" ADD CONSTRAINT "boost_ledger_boost_on_spends" CHECK (("reason" IN ('spend', 'refund')) = ("boostId" IS NOT NULL));
CREATE UNIQUE INDEX "boost_ledger_one_spend_per_boost" ON "boost_ledger"("boostId") WHERE "reason" = 'spend';
CREATE UNIQUE INDEX "boost_ledger_one_refund_per_boost" ON "boost_ledger"("boostId") WHERE "reason" = 'refund';

-- Refunds: every deleted boost that hadn't been settled (its song never
-- started) goes back to the wallet it came from, exactly as spent (the free
-- one stays free). The deleting code may say why with
-- SET LOCAL moozer.refund_cause; 'unplayable' also refunds settled boosts
-- (the song started but YouTube couldn't play it). Deleted accounts forfeit.
-- Free boosts never pile up: a spent free boost isn't refunded if the free one
-- is already back (otherwise parking it on a queued song for 5.5 hours, then
-- removing the song, would bank a second free boost).
CREATE OR REPLACE FUNCTION refund_boost() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  spend boost_ledger%ROWTYPE;
  given_cause text := NULLIF(current_setting('moozer.refund_cause', true), '');
  space_gone boolean;
BEGIN
  IF OLD."settled" AND given_cause IS DISTINCT FROM 'unplayable' THEN
    RETURN NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "user" WHERE id = OLD."userId") THEN
    RETURN NULL;
  END IF;
  SELECT * INTO spend FROM boost_ledger WHERE "boostId" = OLD.id AND reason = 'spend';
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  IF spend."usedFree" AND (
    SELECT reason FROM boost_ledger
    WHERE "userId" = OLD."userId" AND (reason = 'refill' OR "usedFree")
    ORDER BY seq DESC LIMIT 1
  ) <> 'spend' THEN
    RETURN NULL;
  END IF;
  space_gone := NOT EXISTS (SELECT 1 FROM space WHERE id = spend."spaceId");
  INSERT INTO boost_ledger (id, "userId", delta, reason, "usedFree", cause, "boostId", "spaceId", "songTitle")
  VALUES (
    gen_random_uuid()::text, OLD."userId", 1, 'refund', spend."usedFree",
    COALESCE(given_cause, CASE WHEN space_gone THEN 'space_ended' ELSE 'song_removed' END)::"RefundCause",
    OLD.id, CASE WHEN space_gone THEN NULL ELSE spend."spaceId" END, spend."songTitle"
  )
  ON CONFLICT DO NOTHING;
  RETURN NULL;
END;
$$;

CREATE TRIGGER boost_refund AFTER DELETE ON "boost"
  FOR EACH ROW EXECUTE FUNCTION refund_boost();

-- Boosts placed before the wallet existed (development data only): their
-- songs that already started are settled, and each boost gets the free
-- refill and spend it stood for, so balances start at the right place.
UPDATE "boost" b SET "settled" = true FROM "queue_item" q WHERE q.id = b."queueItemId" AND q.status <> 'queued';
INSERT INTO "boost_ledger" (id, "userId", delta, reason, "createdAt")
  SELECT gen_random_uuid()::text, b."userId", 1, 'refill', b."createdAt" FROM "boost" b ORDER BY b."createdAt";
INSERT INTO "boost_ledger" (id, "userId", delta, reason, "usedFree", "boostId", "spaceId", "songTitle", "createdAt")
  SELECT gen_random_uuid()::text, b."userId", -1, 'spend', true, b.id, b."spaceId", q.title, b."createdAt"
  FROM "boost" b JOIN "queue_item" q ON q.id = b."queueItemId" ORDER BY b."createdAt";
