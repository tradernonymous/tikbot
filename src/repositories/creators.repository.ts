import { prisma } from '@/lib/prisma';

export interface PublicCreatorDTO {
  id: string;
  platform: string;
  handle: string;
  followerCount: number;
  videoCount: number;
  medianViews: number;
  madViews: number;
  sampleSize: number;
  lastScrapedAt: string | null;
  createdAt: string;
}

export async function upsertCreator(data: {
  platform?: string;
  handle: string;
  platformUserId?: string;
  followerCount?: number;
  videoCount?: number;
}): Promise<PublicCreatorDTO | null> {
  try {
    const platform = data.platform || 'TIKTOK';
    const row = await prisma.creator.upsert({
      where: {
        platform_handle: {
          platform,
          handle: data.handle,
        },
      },
      update: {
        platformUserId: data.platformUserId,
        ...(data.followerCount !== undefined ? { followerCount: data.followerCount } : {}),
        ...(data.videoCount !== undefined ? { videoCount: data.videoCount } : {}),
      },
      create: {
        platform,
        handle: data.handle,
        platformUserId: data.platformUserId,
        followerCount: data.followerCount || 0,
        videoCount: data.videoCount || 0,
      },
    });

    return {
      id: row.id,
      platform: row.platform,
      handle: row.handle,
      followerCount: row.followerCount,
      videoCount: row.videoCount,
      medianViews: row.medianViews,
      madViews: row.madViews,
      sampleSize: row.sampleSize,
      lastScrapedAt: row.lastScrapedAt?.toISOString() || null,
      createdAt: row.createdAt.toISOString(),
    };
  } catch {
    return null;
  }
}

export async function updateCreatorBaseline(
  id: string,
  median: number,
  mad: number,
  sampleSize: number
): Promise<boolean> {
  try {
    await prisma.creator.update({
      where: { id },
      data: {
        medianViews: median,
        madViews: mad,
        sampleSize,
        lastScrapedAt: new Date(),
      },
    });
    return true;
  } catch {
    return false;
  }
}
