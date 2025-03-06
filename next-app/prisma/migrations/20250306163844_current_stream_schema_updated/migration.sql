/*
  Warnings:

  - You are about to drop the `ActiveStream` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `hostId` on the `Space` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `songUrl` to the `StreamHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Space" ADD COLUMN     "songs" TEXT,
DROP COLUMN "hostId",
ADD COLUMN     "hostId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "StreamHistory" ADD COLUMN     "songUrl" TEXT NOT NULL;

-- DropTable
DROP TABLE "ActiveStream";

-- CreateTable
CREATE TABLE "CurrentStream" (
    "id" SERIAL NOT NULL,
    "streamName" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "streamId" INTEGER NOT NULL,

    CONSTRAINT "CurrentStream_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CurrentStream_streamId_key" ON "CurrentStream"("streamId");
