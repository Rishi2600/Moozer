-- CreateTable
CREATE TABLE "space_speaker" (
    "spaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "space_speaker_pkey" PRIMARY KEY ("spaceId","userId")
);

-- CreateIndex
CREATE INDEX "space_speaker_userId_idx" ON "space_speaker"("userId");

-- AddForeignKey
ALTER TABLE "space_speaker" ADD CONSTRAINT "space_speaker_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_speaker" ADD CONSTRAINT "space_speaker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Approving or turning off a guest speaker changes what their screens show,
-- so it tells the space's screens like votes do.
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
  ELSIF TG_TABLE_NAME IN ('queue_item', 'boost', 'space_speaker') THEN
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

CREATE TRIGGER space_speaker_notify AFTER INSERT OR DELETE ON "space_speaker"
  FOR EACH ROW EXECUTE FUNCTION notify_space_change();
