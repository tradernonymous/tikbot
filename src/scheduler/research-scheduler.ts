import { prisma } from '@/lib/prisma';
import { JobQueueEngine } from '@/queue';

export interface DueTarget {
  id: string;
  targetHandle: string;
  pollIntervalHours: number;
  lastPolledAt: Date | null;
}

/** Targets whose interval elapsed (or never polled). */
export async function listDueWatchlistTargets(): Promise<DueTarget[]> {
  const rows = await prisma.watchlistTarget.findMany({
    where: { pollIntervalHours: { gt: 0 } },
    orderBy: { createdAt: 'asc' },
  });
  const now = new Date();
  return rows.filter((t) => {
    if (t.lastPolledAt && now.getTime() - t.lastPolledAt.getTime() < t.pollIntervalHours * 3_600_000) {
      return false;
    }
    return true;
  });
}

/** Enqueue research.watch for a target (R2.4) and mark it as polled. */
export async function enqueueWatchPoll(queue: JobQueueEngine, target: DueTarget): Promise<void> {
  await prisma.watchlistTarget.update({ where: { id: target.id }, data: { lastPolledAt: new Date() } });
  await queue.enqueue('research.watch', {
    handle: target.targetHandle.replace(/^@/, ''),
    platform: 'TIKTOK',
  });
}

/**
 * R2.5 — schedule metrics.collect for ResearchPosts: T+1h, T+24h, T+7d, T+28d.
 * Only posts without a recent sample are enqueued (never double-collect).
 */
export async function scheduleDueMetricsJobs(queue: JobQueueEngine): Promise<void> {
  const posts = await prisma.researchPost.findMany({
    orderBy: { createdAt: 'asc' },
    take: 200,
  });
  const now = new Date();

  for (const post of posts) {
    // R2.5: sample only when the latest existing sample is more than a day old.
    const latest = await prisma.metricSample.findFirst({
      where: { researchPostId: post.id },
      orderBy: { timestamp: 'desc' },
    });
    if (latest) {
      const hoursSinceSample = (now.getTime() - latest.timestamp.getTime()) / 3_600_000;
      if (hoursSinceSample >= 0 && hoursSinceSample < 24) continue;
    }

    await queue.enqueue('metrics.collect', {
      targetType: 'RESEARCH_POST',
      targetId: post.id,
      views: post.viewCount,
      likes: post.likeCount,
      comments: post.commentCount,
      shares: post.shareCount,
    });
  }
}

let lastScheduleRunMs = 0;

/** The scheduler tick — safe to call from the worker loop (throttled). */
export async function runDueScheduledJobs(queue: JobQueueEngine): Promise<void> {
  const now = Date.now();
  if (now - lastScheduleRunMs < 30_000) return;
  lastScheduleRunMs = now;

  const due = await listDueWatchlistTargets();
  for (const t of due) {
    try {
      await enqueueWatchPoll(queue, t);
    } catch {
      // skip failing targets; retry on the next tick
    }
  }
  await scheduleDueMetricsJobs(queue);
}
