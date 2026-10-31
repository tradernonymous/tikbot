import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession, handleSessionRefresh } from '@/security/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  filter: z.enum(['ALL', 'APPROVAL', 'INCIDENT', 'RESEARCH', 'SYSTEM', 'UNREAD']).default('ALL'),
});

export async function GET(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const { searchParams } = req.nextUrl;
    const parsed = querySchema.safeParse({
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit') || undefined,
      filter: searchParams.get('filter') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const { cursor, limit, filter } = parsed.data;

    const where: any = {};
    if (filter === 'UNREAD') {
      where.readAt = null;
    } else if (filter !== 'ALL') {
      where.type = filter;
    }

    const total = await prisma.notification.count({ where });

    const notifications = await prisma.notification.findMany({
      where,
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    let nextCursor: string | undefined = undefined;
    if (notifications.length > limit) {
      const nextItem = notifications.pop();
      nextCursor = nextItem?.id;
    }

    const res = NextResponse.json({
      success: true,
      notifications,
      nextCursor,
      total,
    });

    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
