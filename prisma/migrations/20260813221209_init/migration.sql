-- CreateEnum
CREATE TYPE "Mode" AS ENUM ('SHADOW', 'LIVE');

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" UUID NOT NULL,
    "targetRef" TEXT NOT NULL,
    "ruleTriggered" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "mode" "Mode" NOT NULL DEFAULT 'SHADOW',
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "Recommendation_mode_idx" ON "Recommendation"("mode");

-- CreateIndex
CREATE INDEX "Recommendation_createdAt_idx" ON "Recommendation"("createdAt");
