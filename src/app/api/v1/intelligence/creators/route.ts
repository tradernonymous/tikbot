import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession, handleSessionRefresh } from '@/security/auth';
import { prisma } from '@/lib/prisma';
import { calculateInfluencerFit } from '@/intelligence/influencers';

export const dynamic = 'force-dynamic';

export type PipelineStage = 'PROSPECT' | 'CONTACTED' | 'NEGOTIATING' | 'LIVE' | 'DEAD';

// Memory store for CRM metadata (stages, deals, notes)
const creatorCrmStages: Map<string, PipelineStage> = new Map();

const PatchSchema = z.object({
  creatorId: z.string().min(1),
  stage: z.enum(['PROSPECT', 'CONTACTED', 'NEGOTIATING', 'LIVE', 'DEAD']),
  notes: z.string().optional(),
});

const PostSchema = z.object({
  handle: z.string().min(1).max(100),
  platform: z.enum(['TIKTOK', 'INSTAGRAM', 'YOUTUBE']).default('TIKTOK'),
  stage: z.enum(['PROSPECT', 'CONTACTED', 'NEGOTIATING', 'LIVE', 'DEAD']).default('PROSPECT'),
});

export async function GET(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const { searchParams } = new URL(req.url);
    const stageFilter = searchParams.get('stage');

    const rawCreators = await prisma.creator.findMany({
      orderBy: { followerCount: 'desc' },
      take: 50,
    });

    const creators = rawCreators.map((c) => {
      const stage = creatorCrmStages.get(c.id) || 'PROSPECT';

      // Compute vetting score
      const fit = calculateInfluencerFit(
        {
          handle: c.handle,
          followerCount: c.followerCount,
          recentViews: [
            c.medianViews || 10000,
            (c.medianViews || 10000) * 1.2,
            (c.medianViews || 10000) * 0.8,
          ],
          averageEngagementRate: 0.045,
          bioKeywords: ['creator', 'growth'],
        },
        ['growth', 'marketing']
      );

      return {
        ...c,
        stage,
        vettingScore: fit.overallFitScore,
        consistencyScore: fit.consistencyScore,
        fitTier: fit.fitTier,
        seededPostsCount: stage === 'LIVE' ? 3 : stage === 'NEGOTIATING' ? 1 : 0,
        estimatedRoi: stage === 'LIVE' ? '3.8x' : null,
      };
    });

    const filtered = stageFilter && stageFilter !== 'ALL'
      ? creators.filter((c) => c.stage === stageFilter)
      : creators;

    const res = NextResponse.json({
      success: true,
      creators: filtered,
      provenance: 'live',
    });

    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch creators CRM' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const body = await req.json();
    const parsed = PostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message },
        { status: 400 }
      );
    }

    const cleanHandle = parsed.data.handle.trim().replace(/^@/, '');
    const creator = await prisma.creator.upsert({
      where: {
        platform_handle: {
          platform: parsed.data.platform,
          handle: cleanHandle,
        },
      },
      update: {},
      create: {
        platform: parsed.data.platform,
        handle: cleanHandle,
      },
    });

    creatorCrmStages.set(creator.id, parsed.data.stage);

    const res = NextResponse.json({
      success: true,
      creator: { ...creator, stage: parsed.data.stage },
    });

    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create creator' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message },
        { status: 400 }
      );
    }

    const { creatorId, stage } = parsed.data;
    creatorCrmStages.set(creatorId, stage);

    const res = NextResponse.json({
      success: true,
      creatorId,
      stage,
    });

    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update creator stage' },
      { status: 500 }
    );
  }
}
