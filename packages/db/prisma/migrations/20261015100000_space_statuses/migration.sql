-- Paused and scheduled spaces. Added before 'ended' so lists that sort by
-- status keep live (then paused, then scheduled) above ended. On their own
-- migration: Postgres can't use a new enum value in the transaction that adds it.
ALTER TYPE "SpaceStatus" ADD VALUE 'paused' BEFORE 'ended';
ALTER TYPE "SpaceStatus" ADD VALUE 'scheduled' BEFORE 'ended';
