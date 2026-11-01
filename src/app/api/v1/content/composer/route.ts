import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession, handleSessionRefresh } from '@/security/auth';
import { prisma } from '@/lib/prisma';
import { ContentComposer } from '@/content/composer';

export const dynamic = 'force-dynamic';

const PostComposerSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('schedule'),
    accountId: z.string().min(1),
    mediaAssetId: z.string().min(1),
    caption: z.string().min(1).max(2200),
    platform: z.enum(['TIKTOK', 'INSTAGRAM_REELS', 'YOUTUBE_SHORTS']).default('TIKTOK'),
    scheduledAt: z.string().datetime(),
  }),
]);

export async function GET(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const [trendSignals, sounds, mediaAssets, accounts] = await Promise.all([
      prisma.trendSignal.findMany({
        where: { type: 'HASHTAG' },
        orderBy: { score: 'desc' },
        take: 15,
      }),
      prisma.sound.findMany({
        orderBy: { usageCount: 'desc' },
        take: 10,
      }),
      prisma.mediaAsset.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.platformAccount.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, username: true },
        take: 20,
      }),
    ]);

    const hashtagSuggestions = trendSignals.map((t) => ({
      tag: t.signalKey.startsWith('#') ? t.signalKey : `#${t.signalKey}`,
      score: t.score,
      velocity: t.velocity,
    }));

    const res = NextResponse.json({
      success: true,
      hashtagSuggestions,
      sounds,
      mediaAssets,
      accounts,
      provenance: 'live',
    });

    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch composer suggestions' },
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
    const parsed = PostComposerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const job = await prisma.publishJob.create({
      data: {
        accountId: data.accountId,
        mediaAssetId: data.mediaAssetId,
        caption: data.caption,
        scheduledAt: new Date(data.scheduledAt),
        status: 'PENDING',
      },
    });

    const res = NextResponse.json({
      success: true,
      job,
    });

    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to schedule post' },
      { status: 500 }
    );
  }
}
