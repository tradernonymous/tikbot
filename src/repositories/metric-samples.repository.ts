import { prisma } from '@/lib/prisma';

export interface PublicMetricSampleDTO {
  id: string;
  targetType: string;
  targetId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  timestamp: string;
}

export async function recordMetricSample(data: {
  targetType: string;
  targetId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  timestamp?: Date;
  researchPostId?: string;
}): Promise<PublicMetricSampleDTO | null> {
  try {
    const row = await prisma.metricSample.create({
      data: {
        targetType: data.targetType,
        targetId: data.targetId,
        views: data.views,
        likes: data.likes,
        comments: data.comments,
        shares: data.shares,
        timestamp: data.timestamp || new Date(),
        researchPostId: data.researchPostId,
      },
    });

    return {
      id: row.id,
      targetType: row.targetType,
      targetId: row.targetId,
      views: row.views,
      likes: row.likes,
      comments: row.comments,
      shares: row.shares,
      timestamp: row.timestamp.toISOString(),
    };
  } catch {
    return null;
  }
}

export async function queryMetricSeries(
  targetType: string,
  targetId: string,
  from?: Date,
  to?: Date
): Promise<PublicMetricSampleDTO[]> {
  try {
    const where: any = {
      targetType,
      targetId,
    };

    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp.gte = from;
      if (to) where.timestamp.lte = to;
    }

    const rows = await prisma.metricSample.findMany({
      where,
      orderBy: { timestamp: 'asc' },
    });

    return rows.map((r) => ({
      id: r.id,
      targetType: r.targetType,
      targetId: r.targetId,
      views: r.views,
      likes: r.likes,
      comments: r.comments,
      shares: r.shares,
      timestamp: r.timestamp.toISOString(),
    }));
  } catch {
    return [];
  }
}
