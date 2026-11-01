import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { requireSession, handleSessionRefresh } from '@/security/auth';
import { prisma } from '@/lib/prisma';
import { computeAspectRatio } from '@/content/media-library';

export const dynamic = 'force-dynamic';

const PostMediaSchema = z.object({
  storageKey: z.string().min(1),
  mimeType: z.string().default('video/mp4'),
  fileSizeBytes: z.number().positive(),
  durationSeconds: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  checksumSha256: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export async function GET(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const { searchParams } = new URL(req.url);
    const tagFilter = searchParams.get('tag');

    const rawAssets = await prisma.mediaAsset.findMany({
      include: {
        publishJobs: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const assets = rawAssets.map((asset) => {
      const metadata = (asset.metadata as Record<string, any>) || {};
      const tags: string[] = Array.isArray(metadata.tags) ? metadata.tags : [];
      const variants: string[] = Array.isArray(metadata.variants) ? metadata.variants : [];
      const aspectRatio = computeAspectRatio(asset.width || undefined, asset.height || undefined);

      return {
        id: asset.id,
        storageKey: asset.storageKey,
        mimeType: asset.mimeType,
        fileSizeBytes: asset.fileSizeBytes,
        durationSeconds: asset.durationSeconds,
        width: asset.width,
        height: asset.height,
        aspectRatio,
        tags,
        variants,
        usageCount: asset.publishJobs.length,
        createdAt: asset.createdAt.toISOString(),
      };
    });

    const filtered = tagFilter && tagFilter !== 'ALL'
      ? assets.filter((a) => a.tags.includes(tagFilter.toLowerCase()))
      : assets;

    const res = NextResponse.json({
      success: true,
      assets: filtered,
      provenance: 'live',
    });

    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch media assets' },
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
    const parsed = PostMediaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const checksum =
      data.checksumSha256 ||
      createHash('sha256').update(data.storageKey + Date.now()).digest('hex');

    const asset = await prisma.mediaAsset.create({
      data: {
        storageKey: data.storageKey,
        mimeType: data.mimeType,
        fileSizeBytes: data.fileSizeBytes,
        durationSeconds: data.durationSeconds,
        width: data.width,
        height: data.height,
        checksumSha256: checksum,
        metadata: {
          tags: data.tags.map((t) => t.toLowerCase()),
          variants: ['ORIGINAL'],
        },
      },
    });

    const res = NextResponse.json({
      success: true,
      asset,
    });

    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create media asset' },
      { status: 500 }
    );
  }
}
