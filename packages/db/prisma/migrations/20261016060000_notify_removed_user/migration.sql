-- Removing someone now also says who, so the realtime server can close
-- that person's open screens (they could otherwise keep sending reactions).
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
  ELSIF TG_TABLE_NAME = 'queue_item' THEN
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
