-- AlterTable
ALTER TABLE "space" ADD COLUMN     "description" VARCHAR(80),
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "listeners" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "scheduledFor" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "space_removal" (
    "spaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "space_removal_pkey" PRIMARY KEY ("spaceId","userId")
);

-- CreateIndex
CREATE INDEX "space_removal_userId_idx" ON "space_removal"("userId");

-- CreateIndex
CREATE INDEX "space_status_isPublic_idx" ON "space"("status", "isPublic");

-- AddForeignKey
ALTER TABLE "space_removal" ADD CONSTRAINT "space_removal_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_removal" ADD CONSTRAINT "space_removal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Invariants Prisma can't express
ALTER TABLE "space" ADD CONSTRAINT "space_description_not_blank" CHECK ("description" IS NULL OR char_length(btrim("description")) > 0);
ALTER TABLE "space" ADD CONSTRAINT "space_listeners_not_negative" CHECK ("listeners" >= 0);
ALTER TABLE "space" ADD CONSTRAINT "space_paused_at_matches_status" CHECK (("status" = 'paused') = ("pausedAt" IS NOT NULL));
ALTER TABLE "space" ADD CONSTRAINT "space_scheduled_for_matches_status" CHECK (("status" = 'scheduled') = ("scheduledFor" IS NOT NULL));

-- Scheduled spaces that are due are opened on read; this finds them fast.
CREATE INDEX "space_scheduled_due_idx" ON "space"("scheduledFor") WHERE "status" = 'scheduled';

-- Realtime notifications.
-- 1. The realtime server rewrites `listeners` whenever someone arrives or
--    leaves. That isn't a change open screens need to re-fetch for, so the
--    space trigger now ignores updates that only touch listeners/updatedAt.
-- 2. Removing someone tells the space's screens, so the removed person's
--    page re-renders into "you were removed".
CREATE OR REPLACE FUNCTION notify_space_change() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  space_id text;
BEGIN
  IF TG_TABLE_NAME = 'space' THEN
    PERFORM pg_notify('space_changes', json_build_object('spaceId', NEW.id, 'slug', NEW.slug, 'status', NEW.status)::text);
    RETURN NULL;
  ELSIF TG_TABLE_NAME = 'queue_item' THEN
    space_id := COALESCE(NEW."spaceId", OLD."spaceId");
  ELSIF TG_TABLE_NAME = 'vote' THEN
    SELECT q."spaceId" INTO space_id FROM queue_item q WHERE q.id = COALESCE(NEW."queueItemId", OLD."queueItemId");
  ELSIF TG_TABLE_NAME = 'space_removal' THEN
    space_id := NEW."spaceId";
  END IF;
  -- A vote removed by its song's own delete has no song left to look up; the
  -- song's trigger already announced that change.
  IF space_id IS NOT NULL THEN
    PERFORM pg_notify('space_changes', json_build_object('spaceId', space_id)::text);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER "space_notify" ON "space";
CREATE TRIGGER space_notify AFTER UPDATE ON "space"
  FOR EACH ROW
  WHEN ((to_jsonb(OLD) - 'listeners' - 'updatedAt') IS DISTINCT FROM (to_jsonb(NEW) - 'listeners' - 'updatedAt'))
  EXECUTE FUNCTION notify_space_change();
CREATE TRIGGER space_removal_notify AFTER INSERT ON "space_removal"
  FOR EACH ROW EXECUTE FUNCTION notify_space_change();
