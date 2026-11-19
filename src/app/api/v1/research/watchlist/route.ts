import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession, handleSessionRefresh } from '@/security/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const listWatchlistsSchema = z.object({
  includeTargets: z.boolean().optional(),
});

const upsertWatchlistSchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().optional(),
  targets: z
    .array(
      z.object({
        targetHandle: z.string().min(1).max(100, 'targetHandle must be 1-100 chars'),
        pollIntervalHours: z.number().int().min(1).max(8760).default(24),
      })
    )
    .default([]),
});

const updateTargetSchema = z.object({
  id: z.string().min(1, 'id is required'),
  pollIntervalHours: z.number().int().min(1).max(8760, 'pollIntervalHours must be 1-8760').optional(),
  rearm: z.boolean().optional(),
});

const deleteTargetSchema = z.object({
  id: z.string().min(1, 'id is required'),
});

function watchlistsWithTargets(where?: Record<string, unknown>, selectAll = true) {
  return prisma.watchlist.findMany({
    where: where as any,
    orderBy: { createdAt: 'desc' },
    include: { targets: { orderBy: { createdAt: 'asc' } } },
  });
}

export async function GET(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) return auth;

    const parsed = listWatchlistsSchema.safeParse({} as Record<string, unknown>);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const watchlists = await watchlistsWithTargets();
    const res = NextResponse.json({ success: true, watchlists });
    return handleSessionRefresh(auth, res);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to list watchlists' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) return auth;

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = upsertWatchlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ') },
        { status: 400 }
      );
    }

    const watchlist = await prisma.watchlist.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        targets: {
          createMany: {
            data: parsed.data.targets.map((t) => ({
              platform: 'TIKTOK',
              targetHandle: t.targetHandle.replace(/^@/, ''),
              pollIntervalHours: t.pollIntervalHours,
            })),
          },
        },
      },
      include: { targets: { orderBy: { createdAt: 'asc' } } },
    });

    const res = NextResponse.json({ success: true, watchlist });
    return handleSessionRefresh(auth, res);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to create watchlist' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) return auth;

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = updateTargetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ') },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.pollIntervalHours !== undefined) data.pollIntervalHours = parsed.data.pollIntervalHours;
    if (parsed.data.rearm) data.lastPolledAt = null;

    const target = await prisma.watchlistTarget.update({
      where: { id: parsed.data.id },
      data,
    });

    const res = NextResponse.json({ success: true, target });
    return handleSessionRefresh(auth, res);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to update watchlist target' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) return auth;

    let body: any;
    try {
      body = await req.json();
    } catch {
      body = null;
    }
    const parsed = deleteTargetSchema.safeParse(body);
    if (!parsed.success) {
      const id = req.nextUrl.searchParams.get('id');
      if (id) {
        const deleted = await prisma.watchlistTarget.delete({ where: { id } });
        return handleSessionRefresh(auth, NextResponse.json({ success: true, target: deleted }));
      }
      return NextResponse.json(
        { success: false, error: 'target id is required' },
        { status: 400 }
      );
    }

    const deleted = await prisma.watchlistTarget.delete({ where: { id: parsed.data.id } });
    const res = NextResponse.json({ success: true, target: deleted });
    return handleSessionRefresh(auth, res);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to delete watchlist target' },
      { status: 500 }
    );
  }
}
