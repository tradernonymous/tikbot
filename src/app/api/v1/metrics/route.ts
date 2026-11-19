import { NextRequest, NextResponse } from 'next/server';
import { requireSession, handleSessionRefresh } from '@/security/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const STALE_WORKER_MS = 60_000;

export async function GET(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const t0 = Date.now();
    const heartbeats = await prisma.systemSetting.findMany({
      where: { key: { startsWith: 'WORKER_HEARTBEAT_' } },
    });
    const workers = heartbeats
      .map((h) => ({
        id: h.key.slice('WORKER_HEARTBEAT_'.length),
        ageSeconds: Math.max(0, Math.floor((Date.now() - new Date(h.value).getTime()) / 1000)),
      }))
      .sort((a, b) => a.ageSeconds - b.ageSeconds);
    const workersStale = workers.filter((w) => w.ageSeconds * 1000 > STALE_WORKER_MS);

    const [pending, running, completed, failed, deadLetter] = await Promise.all([
      prisma.job.count({ where: { status: 'PENDING' } }),
      prisma.job.count({ where: { status: 'RUNNING' } }),
      prisma.job.count({ where: { status: 'COMPLETED' } }),
      prisma.job.count({ where: { status: 'FAILED' } }),
      prisma.job.count({ where: { status: 'DEAD_LETTER' } }),
    ]);

    const res = NextResponse.json({
      success: true,
      system: {
        dbLatencyMs: Math.max(0, Date.now() - t0),
        uptimeSeconds: Math.round(process.uptime()),
        node: process.version,
      },
      workers: {
        count: workers.length,
        stale: workersStale,
      },
      jobs: {
        queueDepth: pending,
        pending,
        running,
        completed,
        failed,
        deadLetter,
      },
    });

    return handleSessionRefresh(auth, res);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
