# ADR-003: Postgres-Backed Job Queue Engine (with Redis Dual-Mode Option)

## Status
Accepted

## Context
Background tasks (scraping feeds, downloading media, transcribing video audio, executing farm warmup steps, and publishing posts) require reliable queuing, retries with exponential backoff, priority scheduling, and concurrency controls.
While external queue systems (e.g. SQS, BullMQ) are common, introducing hard dependencies on complex broker infrastructure adds operational overhead, while pure Redis queues lack transactional guarantees when updating related relational database entities.

## Decision
We implement a **PostgreSQL-backed Job Queue** utilizing `FOR UPDATE SKIP LOCKED` row-level locking natively within Prisma / Postgres, with an optional Redis PubSub fast-wake signal.

### Architectural Details
- **Schema**: Dedicated `Job` table tracking `id`, `name`, `payload`, `status` (`PENDING`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`), `priority`, `runAt`, `lockedAt`, `lockedBy`, `attempts`, `maxAttempts`, `lastError`.
- **Claim Logic**:
  ```sql
  UPDATE "Job"
  SET "status" = 'RUNNING',
      "lockedAt" = NOW(),
      "lockedBy" = $workerId,
      "attempts" = "attempts" + 1
  WHERE "id" = (
    SELECT "id"
    FROM "Job"
    WHERE "status" = 'PENDING'
      AND "runAt" <= NOW()
    ORDER BY "priority" DESC, "runAt" ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
  ```
- **Atomicity**: Job submission, status updates, and corresponding domain state changes (e.g., updating a `PostArchive` status to `DOWNLOADED` while marking the job `COMPLETED`) occur in the exact same database transaction.
- **Retries & Backoff**: Failed jobs record `lastError` and increment `attempts`. If `attempts < maxAttempts`, status is reset to `PENDING` with an exponential backoff formula: $\text{delay} = \text{baseDelay} \times 2^{\text{attempts}} + \text{jitter}$.

## Consequences
- Zero external broker dependencies for core operations; Postgres is the single source of truth.
- `FOR UPDATE SKIP LOCKED` prevents race conditions across multiple worker processes without table lock contention.
- For high-throughput bursts, Redis can be used as a notify channel (`NOTIFY new_job`) to awaken dormant workers without tight polling loops.
