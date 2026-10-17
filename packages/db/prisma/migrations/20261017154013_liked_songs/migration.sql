-- CreateTable
CREATE TABLE "liked_song" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "SongSource" NOT NULL DEFAULT 'youtube',
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "channel" TEXT,
    "thumbnailUrl" TEXT NOT NULL,
    "durationSeconds" INTEGER,
    "likedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "liked_song_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "liked_song_userId_likedAt_idx" ON "liked_song"("userId", "likedAt");

-- CreateIndex
CREATE UNIQUE INDEX "liked_song_userId_source_sourceId_key" ON "liked_song"("userId", "source", "sourceId");

-- AddForeignKey
ALTER TABLE "liked_song" ADD CONSTRAINT "liked_song_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
