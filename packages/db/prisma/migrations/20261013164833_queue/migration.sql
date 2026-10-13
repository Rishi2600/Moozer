/*
  Warnings:

  - You are about to drop the `Stream` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Upvote` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SongSource" AS ENUM ('youtube', 'spotify');

-- CreateEnum
CREATE TYPE "QueueItemStatus" AS ENUM ('queued', 'playing', 'played');

-- DropForeignKey
ALTER TABLE "Stream" DROP CONSTRAINT "Stream_userId_fkey";

-- DropForeignKey
ALTER TABLE "Upvote" DROP CONSTRAINT "Upvote_StreamId_fkey";

-- DropForeignKey
ALTER TABLE "Upvote" DROP CONSTRAINT "Upvote_UserId_fkey";

-- DropTable
DROP TABLE "Stream";

-- DropTable
DROP TABLE "Upvote";

-- DropEnum
DROP TYPE "StreamType";

-- CreateTable
CREATE TABLE "queue_item" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "source" "SongSource" NOT NULL DEFAULT 'youtube',
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "channel" TEXT,
    "thumbnailUrl" TEXT NOT NULL,
    "durationSeconds" INTEGER,
    "status" "QueueItemStatus" NOT NULL DEFAULT 'queued',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finalVotes" INTEGER,

    CONSTRAINT "queue_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vote" (
    "queueItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vote_pkey" PRIMARY KEY ("queueItemId","userId")
);

-- CreateIndex
CREATE INDEX "queue_item_spaceId_status_addedAt_idx" ON "queue_item"("spaceId", "status", "addedAt");

-- CreateIndex
CREATE INDEX "queue_item_addedById_idx" ON "queue_item"("addedById");

-- CreateIndex
CREATE INDEX "vote_userId_idx" ON "vote"("userId");

-- AddForeignKey
ALTER TABLE "queue_item" ADD CONSTRAINT "queue_item_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_item" ADD CONSTRAINT "queue_item_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote" ADD CONSTRAINT "vote_queueItemId_fkey" FOREIGN KEY ("queueItemId") REFERENCES "queue_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote" ADD CONSTRAINT "vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Invariants Prisma can't express
-- At most one song playing per space.
CREATE UNIQUE INDEX "queue_item_one_playing_per_space" ON "queue_item"("spaceId") WHERE "status" = 'playing';
-- A video can't be queued (or playing) twice in the same space; it can come back after it played.
CREATE UNIQUE INDEX "queue_item_no_duplicate_active" ON "queue_item"("spaceId", "source", "sourceId") WHERE "status" IN ('queued', 'playing');
-- startedAt and finalVotes are set exactly once a song has started playing.
ALTER TABLE "queue_item" ADD CONSTRAINT "queue_item_started_matches_status"
  CHECK (("status" = 'queued') = ("startedAt" IS NULL) AND ("startedAt" IS NULL) = ("finalVotes" IS NULL));
ALTER TABLE "queue_item" ADD CONSTRAINT "queue_item_final_votes_non_negative" CHECK ("finalVotes" IS NULL OR "finalVotes" >= 0);
