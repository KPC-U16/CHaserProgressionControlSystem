-- CreateEnum
CREATE TYPE "public"."Side" AS ENUM ('COOL', 'HOT');

-- CreateEnum
CREATE TYPE "public"."Half" AS ENUM ('FIRST', 'SECOND');

-- CreateTable
CREATE TABLE "public"."Participant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Match" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "agent1Id" INTEGER NOT NULL,
    "agent2Id" INTEGER NOT NULL,
    "winnerId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Score" (
    "id" SERIAL NOT NULL,
    "matchId" INTEGER NOT NULL,
    "half" "public"."Half" NOT NULL,
    "coolId" INTEGER NOT NULL,
    "hotId" INTEGER NOT NULL,
    "coolScore" INTEGER NOT NULL,
    "hotScore" INTEGER NOT NULL,
    "put" "public"."Side",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Match_agent1Id_idx" ON "public"."Match"("agent1Id");

-- CreateIndex
CREATE INDEX "Match_agent2Id_idx" ON "public"."Match"("agent2Id");

-- CreateIndex
CREATE INDEX "Match_winnerId_idx" ON "public"."Match"("winnerId");

-- CreateIndex
CREATE INDEX "Score_coolId_idx" ON "public"."Score"("coolId");

-- CreateIndex
CREATE INDEX "Score_hotId_idx" ON "public"."Score"("hotId");

-- CreateIndex
CREATE UNIQUE INDEX "Score_matchId_half_key" ON "public"."Score"("matchId", "half");

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_agent1Id_fkey" FOREIGN KEY ("agent1Id") REFERENCES "public"."Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_agent2Id_fkey" FOREIGN KEY ("agent2Id") REFERENCES "public"."Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "public"."Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Score" ADD CONSTRAINT "Score_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Score" ADD CONSTRAINT "Score_coolId_fkey" FOREIGN KEY ("coolId") REFERENCES "public"."Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Score" ADD CONSTRAINT "Score_hotId_fkey" FOREIGN KEY ("hotId") REFERENCES "public"."Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
