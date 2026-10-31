-- CreateTable
CREATE TABLE "AccountActionLedger" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountActionLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountActionLedger_accountId_actionType_timestamp_idx" ON "AccountActionLedger"("accountId", "actionType", "timestamp");
