-- Tell the realtime server when anything in a space changes.
-- Channel "space_changes", payload JSON {"spaceId": ...}; changes to the space
-- row itself also carry its slug and status so open screens can follow a
-- reset link or show that the space ended. Notifications are sent on commit,
-- and identical ones within a transaction are merged.
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
  END IF;
  -- A vote removed by its song's own delete has no song left to look up; the
  -- song's trigger already announced that change.
  IF space_id IS NOT NULL THEN
    PERFORM pg_notify('space_changes', json_build_object('spaceId', space_id)::text);
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER queue_item_notify AFTER INSERT OR UPDATE OR DELETE ON "queue_item"
  FOR EACH ROW EXECUTE FUNCTION notify_space_change();
CREATE TRIGGER vote_notify AFTER INSERT OR DELETE ON "vote"
  FOR EACH ROW EXECUTE FUNCTION notify_space_change();
CREATE TRIGGER space_notify AFTER UPDATE ON "space"
  FOR EACH ROW EXECUTE FUNCTION notify_space_change();
