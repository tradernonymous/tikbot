import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession, handleSessionRefresh } from '@/security/auth';
import { prisma } from '@/lib/prisma';
import { detectSoundLifecycle } from '@/intelligence/trend-radar';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  type: z.enum(['HASHTAG', 'SOUND', 'RISING', 'REGION', 'ALL']).default('ALL'),
  region: z.string().optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  sort: z.enum(['score', 'velocity', 'sampleSize', 'lastSeenAt']).default('score'),
  dir: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const { searchParams } = new URL(req.url);
    const parseResult = QuerySchema.safeParse({
      type: searchParams.get('type') || undefined,
      region: searchParams.get('region') || undefined,
      minScore: searchParams.get('minScore') || undefined,
      sort: searchParams.get('sort') || undefined,
      dir: searchParams.get('dir') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.message },
        { status: 400 }
      );
    }

    const { type, region, minScore, sort, dir, limit } = parseResult.data;

    const where: any = {};
    if (type !== 'ALL') {
      where.type = type;
    }
    if (region && region !== 'ALL') {
      where.region = region;
    }
    if (minScore !== undefined) {
      where.score = { gte: minScore };
    }

    const rawSignals = await prisma.trendSignal.findMany({
      where,
      orderBy: { [sort]: dir },
      take: limit,
    });

    const trends = rawSignals.map((signal) => {
      const lifecyclePhase =
        signal.type === 'SOUND'
          ? detectSoundLifecycle(signal.velocity, signal.sampleSize)
          : undefined;

      return {
        ...signal,
        lifecyclePhase,
      };
    });

    const res = NextResponse.json({
      success: true,
      trends,
      provenance: 'live',
    });

    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch trends' },
      { status: 500 }
    );
  }
}
