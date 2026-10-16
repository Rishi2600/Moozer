-- CreateTable
CREATE TABLE "boost" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "queueItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "boost_spaceId_userId_createdAt_idx" ON "boost"("spaceId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "boost_queueItemId_idx" ON "boost"("queueItemId");

-- CreateIndex
CREATE INDEX "boost_userId_idx" ON "boost"("userId");

-- AddForeignKey
ALTER TABLE "boost" ADD CONSTRAINT "boost_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boost" ADD CONSTRAINT "boost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boost" ADD CONSTRAINT "boost_queueItemId_fkey" FOREIGN KEY ("queueItemId") REFERENCES "queue_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Boosts change the ballot, so they tell the space's screens like votes do.
CREATE OR REPLACE FUNCTION notify_space_change() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  space_id text;
BEGIN
  IF TG_TABLE_NAME = 'space' THEN
    PERFORM pg_notify('space_changes', json_build_object('spaceId', NEW.id, 'slug', NEW.slug, 'status', NEW.status)::text);
    RETURN NULL;
  ELSIF TG_TABLE_NAME = 'space_removal' THEN
    PERFORM pg_notify('space_changes', json_build_object('spaceId', NEW."spaceId", 'removedUserId', NEW."userId")::text);
    RETURN NULL;
  ELSIF TG_TABLE_NAME IN ('queue_item', 'boost') THEN
    space_id := COALESCE(NEW."spaceId", OLD."spaceId");
  ELSIF TG_TABLE_NAME = 'vote' THEN
    SELECT q."spaceId" INTO space_id FROM queue_item q WHERE q.id = COALESCE(NEW."queueItemId", OLD."queueItemId");
  END IF;
  -- A vote removed by its song's own delete has no song left to look up; the
  -- song's trigger already announced that change.
  IF space_id IS NOT NULL THEN
    PERFORM pg_notify('space_changes', json_build_object('spaceId', space_id)::text);
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER boost_notify AFTER INSERT OR DELETE ON "boost"
  FOR EACH ROW EXECUTE FUNCTION notify_space_change();
