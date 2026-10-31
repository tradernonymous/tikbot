-- CreateTable
CREATE TABLE "Creator" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'TIKTOK',
    "handle" TEXT NOT NULL,
    "platformUserId" TEXT,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "videoCount" INTEGER NOT NULL DEFAULT 0,
    "medianViews" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "madViews" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "lastScrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Creator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchPost" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'TIKTOK',
    "platformPostId" TEXT NOT NULL,
    "authorHandle" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "hookText" TEXT,
    "hookType" TEXT,
    "outlierScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "medianBaseline" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "creatorId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostSnapshot" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistTarget" (
    "id" TEXT NOT NULL,
    "watchlistId" TEXT NOT NULL,
    "creatorId" TEXT,
    "platform" TEXT NOT NULL DEFAULT 'TIKTOK',
    "targetHandle" TEXT NOT NULL,
    "pollIntervalHours" INTEGER NOT NULL DEFAULT 24,
    "lastPolledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchlistTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendSignal" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "signalKey" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "velocity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "region" TEXT NOT NULL DEFAULT 'US',
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrendSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sound" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'TIKTOK',
    "platformSoundId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "durationSeconds" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hook" (
    "id" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "textTemplate" TEXT NOT NULL,
    "retentionProxyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPlan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "theme" TEXT,
    "hookPattern" TEXT,
    "captionDraft" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IDEA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricSample" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "researchPostId" TEXT,

    CONSTRAINT "MetricSample_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Creator_platform_handle_key" ON "Creator"("platform", "handle");
CREATE INDEX "Creator_handle_idx" ON "Creator"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchPost_platform_platformPostId_key" ON "ResearchPost"("platform", "platformPostId");
CREATE INDEX "ResearchPost_authorHandle_idx" ON "ResearchPost"("authorHandle");
CREATE INDEX "ResearchPost_outlierScore_idx" ON "ResearchPost"("outlierScore");
CREATE INDEX "ResearchPost_createdAt_idx" ON "ResearchPost"("createdAt");

-- CreateIndex
CREATE INDEX "PostSnapshot_postId_capturedAt_idx" ON "PostSnapshot"("postId", "capturedAt");

-- CreateIndex
CREATE INDEX "WatchlistTarget_watchlistId_idx" ON "WatchlistTarget"("watchlistId");
CREATE INDEX "WatchlistTarget_targetHandle_idx" ON "WatchlistTarget"("targetHandle");

-- CreateIndex
CREATE UNIQUE INDEX "TrendSignal_type_signalKey_region_key" ON "TrendSignal"("type", "signalKey", "region");
CREATE INDEX "TrendSignal_type_score_idx" ON "TrendSignal"("type", "score");

-- CreateIndex
CREATE UNIQUE INDEX "Sound_platform_platformSoundId_key" ON "Sound"("platform", "platformSoundId");

-- CreateIndex
CREATE INDEX "Hook_pattern_idx" ON "Hook"("pattern");

-- CreateIndex
CREATE INDEX "ContentPlan_status_idx" ON "ContentPlan"("status");

-- CreateIndex
CREATE INDEX "MetricSample_targetType_targetId_timestamp_idx" ON "MetricSample"("targetType", "targetId", "timestamp");

-- AddForeignKey
ALTER TABLE "ResearchPost" ADD CONSTRAINT "ResearchPost_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostSnapshot" ADD CONSTRAINT "PostSnapshot_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ResearchPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistTarget" ADD CONSTRAINT "WatchlistTarget_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistTarget" ADD CONSTRAINT "WatchlistTarget_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricSample" ADD CONSTRAINT "MetricSample_researchPostId_fkey" FOREIGN KEY ("researchPostId") REFERENCES "ResearchPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;
