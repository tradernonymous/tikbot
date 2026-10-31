import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [pendingJobs, runningJobs, totalAccounts, activeAccounts, bannedAccounts, heartbeatSetting] =
      await Promise.all([
        prisma.job.count({ where: { status: 'PENDING' } }),
        prisma.job.count({ where: { status: 'RUNNING' } }),
        prisma.platformAccount.count(),
        prisma.platformAccount.count({ where: { status: 'ACTIVE' } }),
        prisma.platformAccount.count({ where: { status: 'BANNED' } }),
        prisma.systemSetting.findUnique({ where: { key: 'WORKER_HEARTBEAT' } }),
      ]);

    const banRate =
      totalAccounts > 0
        ? Number(((bannedAccounts / totalAccounts) * 100).toFixed(2))
        : 0;

    let heartbeatAgeSeconds = 9999;
    if (heartbeatSetting?.value) {
      try {
        const parsed = JSON.parse(heartbeatSetting.value);
        if (parsed.timestamp) {
          const diffMs = Date.now() - new Date(parsed.timestamp).getTime();
          heartbeatAgeSeconds = Math.max(0, Math.round(diffMs / 1000));
        }
      } catch {
        // Fallback to default
      }
    }

    const lines = [
      '# HELP tikbot_health_status Application health flag',
      '# TYPE tikbot_health_status gauge',
      'tikbot_health_status 1',
      '',
      '# HELP tikbot_queue_depth Count of jobs in queue by status',
      '# TYPE tikbot_queue_depth gauge',
      `tikbot_queue_depth{status="pending"} ${pendingJobs}`,
      `tikbot_queue_depth{status="running"} ${runningJobs}`,
      '',
      '# HELP tikbot_accounts_fleet Account fleet metrics',
      '# TYPE tikbot_accounts_fleet gauge',
      `tikbot_accounts_total ${totalAccounts}`,
      `tikbot_accounts_active ${activeAccounts}`,
      `tikbot_accounts_banned ${bannedAccounts}`,
      `tikbot_accounts_ban_rate ${banRate}`,
      '',
      '# HELP tikbot_worker_heartbeat_age_seconds Seconds since last worker heartbeat',
      '# TYPE tikbot_worker_heartbeat_age_seconds gauge',
      `tikbot_worker_heartbeat_age_seconds ${heartbeatAgeSeconds}`,
    ];

    return new NextResponse(lines.join('\n') + '\n', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch {
    const fallback = [
      '# HELP tikbot_health_status Application health flag',
      '# TYPE tikbot_health_status gauge',
      'tikbot_health_status 0',
    ].join('\n');

    return new NextResponse(fallback + '\n', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}
