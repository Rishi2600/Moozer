/*
  Warnings:

  - Added the required column `host` to the `Space` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hostId` to the `Space` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Space` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Space" ADD COLUMN     "host" TEXT NOT NULL,
ADD COLUMN     "hostId" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT NOT NULL;
