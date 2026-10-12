-- CreateTable
CREATE TABLE "StreamHistory" (
    "songId" SERIAL NOT NULL,
    "songs" TEXT[],
    "timePlayed" INTEGER,

    CONSTRAINT "StreamHistory_pkey" PRIMARY KEY ("songId")
);

-- CreateTable
CREATE TABLE "Space" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "Space_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveStream" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "ActiveStream_pkey" PRIMARY KEY ("id")
);
