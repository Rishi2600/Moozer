-- CreateEnum
CREATE TYPE "SpaceStatus" AS ENUM ('live', 'ended');

-- CreateTable
CREATE TABLE "space" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "slug" TEXT NOT NULL,
    "joinCode" CHAR(6) NOT NULL,
    "status" "SpaceStatus" NOT NULL DEFAULT 'live',
    "hostId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "space_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "space_member" (
    "spaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "space_member_pkey" PRIMARY KEY ("spaceId","userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "space_slug_key" ON "space"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "space_joinCode_key" ON "space"("joinCode");

-- CreateIndex
CREATE INDEX "space_hostId_createdAt_idx" ON "space"("hostId", "createdAt");

-- CreateIndex
CREATE INDEX "space_member_userId_lastSeenAt_idx" ON "space_member"("userId", "lastSeenAt");

-- AddForeignKey
ALTER TABLE "space" ADD CONSTRAINT "space_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_member" ADD CONSTRAINT "space_member_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_member" ADD CONSTRAINT "space_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Invariants Prisma can't express
ALTER TABLE "space" ADD CONSTRAINT "space_name_not_blank" CHECK (char_length(btrim("name")) > 0);
ALTER TABLE "space" ADD CONSTRAINT "space_ended_at_matches_status" CHECK (("status" = 'ended') = ("endedAt" IS NOT NULL));
