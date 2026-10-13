-- AlterTable
ALTER TABLE "queue_item" ADD COLUMN     "anchorAt" TIMESTAMP(3),
ADD COLUMN     "pausedAtMs" INTEGER;

-- Playback position only exists on the song that's playing; a paused position is never negative.
ALTER TABLE "queue_item" ADD CONSTRAINT "queue_item_playback_only_while_playing"
  CHECK ("status" = 'playing' OR ("anchorAt" IS NULL AND "pausedAtMs" IS NULL));
ALTER TABLE "queue_item" ADD CONSTRAINT "queue_item_paused_position_non_negative"
  CHECK ("pausedAtMs" IS NULL OR "pausedAtMs" >= 0);
-- Songs already playing get an anchor so their progress starts from when they began.
UPDATE "queue_item" SET "anchorAt" = "startedAt" WHERE "status" = 'playing';
