-- AlterTable
ALTER TABLE "queue_item" ADD COLUMN     "dedication" VARCHAR(60);

-- A dedication is either absent or has something in it.
ALTER TABLE "queue_item" ADD CONSTRAINT "queue_item_dedication_not_blank"
  CHECK ("dedication" IS NULL OR char_length(btrim("dedication")) > 0);
