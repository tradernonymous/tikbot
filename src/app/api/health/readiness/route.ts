import { NextResponse } from 'next/server';
import { checkReadiness } from '@/health';
import { globalKillSwitch } from '@/security/kill-switch';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const readiness = await checkReadiness({
    checkDatabase: async () => {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    },
    getQueueDepth: async () => {
      try {
        return await prisma.job.count({ where: { status: 'PENDING' } });
      } catch {
        return 0;
      }
    },
    getWorkerHeartbeat: async () => {
      try {
        const row = await prisma.systemSetting.findUnique({ where: { key: 'WORKER_HEARTBEAT' } });
        return row?.value || null;
      } catch {
        return null;
      }
    },
    isKillSwitchActive: () => globalKillSwitch.isActive(),
  });

  const statusCode = readiness.status === 'DOWN' ? 503 : 200;
  return NextResponse.json(readiness, { status: statusCode });
}
