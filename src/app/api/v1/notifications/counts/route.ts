import { NextRequest, NextResponse } from 'next/server';
import { requireSession, handleSessionRefresh } from '@/security/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const [total, approvals, incidents, research, system] = await Promise.all([
      prisma.notification.count({ where: { readAt: null } }),
      prisma.notification.count({ where: { readAt: null, type: 'APPROVAL' } }),
      prisma.notification.count({ where: { readAt: null, type: 'INCIDENT' } }),
      prisma.notification.count({ where: { readAt: null, type: 'RESEARCH' } }),
      prisma.notification.count({ where: { readAt: null, type: 'SYSTEM' } }),
    ]);

    const res = NextResponse.json({
      success: true,
      counts: {
        total,
        approvals,
        incidents,
        research,
        system,
      },
    });

    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch notification counts' },
      { status: 500 }
    );
  }
}
