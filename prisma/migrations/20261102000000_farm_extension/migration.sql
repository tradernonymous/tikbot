-- CreateTable
CREATE TABLE "FarmDevicePersona" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "engine" TEXT NOT NULL DEFAULT 'CAMOUFOX',
    "screenResolution" TEXT NOT NULL,
    "gpuRenderer" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "fonts" JSONB NOT NULL,
    "canvasNoiseSeed" TEXT NOT NULL,
    "webglNoiseSeed" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "ja4TlsFingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmDevicePersona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmIdentityLink" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "proxyId" TEXT NOT NULL,
    "proxySubnet" TEXT NOT NULL,
    "emailSlot" TEXT NOT NULL,
    "phoneSlot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmIdentityLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmIncidentLog" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "proxyId" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "details" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmIncidentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmNicheCurriculum" (
    "id" TEXT NOT NULL,
    "nicheKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hashtags" JSONB NOT NULL,
    "creators" JSONB NOT NULL,
    "sounds" JSONB NOT NULL,
    "targetAlignmentThreshold" DOUBLE PRECISION NOT NULL DEFAULT 70.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmNicheCurriculum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmAccountNicheAlignment" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "alignmentScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "lastSampledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmAccountNicheAlignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmBoostOrder" (
    "id" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "targetHandle" TEXT NOT NULL,
    "goalTier" TEXT NOT NULL,
    "targetReach" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "velocityCurve" JSONB,
    "stats" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmBoostOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FarmDevicePersona_accountId_key" ON "FarmDevicePersona"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "FarmIdentityLink_accountId_key" ON "FarmIdentityLink"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "FarmIdentityLink_personaId_key" ON "FarmIdentityLink"("personaId");

-- CreateIndex
CREATE UNIQUE INDEX "FarmIdentityLink_emailSlot_key" ON "FarmIdentityLink"("emailSlot");

-- CreateIndex
CREATE UNIQUE INDEX "FarmIdentityLink_phoneSlot_key" ON "FarmIdentityLink"("phoneSlot");

-- CreateIndex
CREATE INDEX "FarmIdentityLink_proxySubnet_idx" ON "FarmIdentityLink"("proxySubnet");

-- CreateIndex
CREATE INDEX "FarmIdentityLink_proxyId_idx" ON "FarmIdentityLink"("proxyId");

-- CreateIndex
CREATE INDEX "FarmIncidentLog_accountId_timestamp_idx" ON "FarmIncidentLog"("accountId", "timestamp");

-- CreateIndex
CREATE INDEX "FarmIncidentLog_proxyId_idx" ON "FarmIncidentLog"("proxyId");

-- CreateIndex
CREATE INDEX "FarmIncidentLog_type_idx" ON "FarmIncidentLog"("type");

-- CreateIndex
CREATE UNIQUE INDEX "FarmNicheCurriculum_nicheKey_key" ON "FarmNicheCurriculum"("nicheKey");

-- CreateIndex
CREATE INDEX "FarmAccountNicheAlignment_alignmentScore_idx" ON "FarmAccountNicheAlignment"("alignmentScore");

-- CreateIndex
CREATE UNIQUE INDEX "FarmAccountNicheAlignment_accountId_curriculumId_key" ON "FarmAccountNicheAlignment"("accountId", "curriculumId");

-- CreateIndex
CREATE INDEX "FarmBoostOrder_status_idx" ON "FarmBoostOrder"("status");

-- CreateIndex
CREATE INDEX "FarmBoostOrder_targetHandle_idx" ON "FarmBoostOrder"("targetHandle");

-- AddForeignKey
ALTER TABLE "FarmIdentityLink" ADD CONSTRAINT "FarmIdentityLink_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "FarmDevicePersona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmAccountNicheAlignment" ADD CONSTRAINT "FarmAccountNicheAlignment_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "FarmNicheCurriculum"("id") ON DELETE CASCADE ON UPDATE CASCADE;
