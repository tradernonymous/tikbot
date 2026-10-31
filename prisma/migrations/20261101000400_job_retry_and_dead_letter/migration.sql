-- AlterEnum
ALTER TYPE "JobStatus" ADD VALUE 'DEAD_LETTER';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN "deadLetterReason" TEXT,
ADD COLUMN "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Job_idempotencyKey_key" ON "Job"("idempotencyKey");
