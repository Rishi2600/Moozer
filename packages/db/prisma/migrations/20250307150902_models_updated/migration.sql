/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `CurrentStream` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hostId]` on the table `Space` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CurrentStream_userId_key" ON "CurrentStream"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Space_hostId_key" ON "Space"("hostId");
