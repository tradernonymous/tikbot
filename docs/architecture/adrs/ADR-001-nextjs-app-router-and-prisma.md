# ADR-001: Next.js App Router and Prisma with PostgreSQL

## Status
Accepted

## Context
The application serves as both an analytical intelligence dashboard and a real-time operational farm control center. We need:
1. High-velocity server-rendered pages and server actions for the single-operator dashboard.
2. A typed ORM with robust migration tracking and relational schema guarantees across complex entities (accounts, posts, metrics, proxies, approvals, jobs).
3. First-class TypeScript integration to adhere to the strict TDD mandate.

## Decision
We select **Next.js 15/16 App Router** in combination with **Prisma ORM** connecting to **PostgreSQL**.

### Rationale
- **App Router**: Native React Server Components (RSC) eliminate client-side bundle bloat for large analytical data views (transcripts, outlier metrics). Streaming SSR enables fast data loading.
- **Route Handlers & Server Actions**: Eliminates boilerplate API layers while providing typed contract boundaries for internal UI actions and webhook receivers.
- **Prisma ORM**:
  - Strongly typed client generated from declarative schema files.
  - Transparent transaction management (`prisma.$transaction`) essential for financial order balances, campaign decrementing, and queue locks.
  - Automated migration engine (`prisma migrate`) with drift detection for repeatable Railway deployments.

## Consequences
- Requires strict separation of database connection pooling in serverless/worker runtimes (using `PrismaClient` singleton with `pgbouncer` or connection limits).
- Next.js Edge runtime cannot run full Prisma client; all API routes interacting with database must run in standard Node.js runtime.
