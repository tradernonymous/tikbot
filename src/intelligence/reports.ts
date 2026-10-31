export interface PostPerformanceSample {
  id: string;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  hookType?: string;
  durationSeconds?: number;
}

export interface PerformanceReportResult {
  timeframeDays: number;
  postCount: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  averageEngagementRate: number;
  posts: Array<PostPerformanceSample & { engagementRate: number }>;
}

export function generatePostPerformanceReport(
  posts: PostPerformanceSample[],
  timeframeDays: 7 | 30 | 90,
  referenceDate: Date = new Date()
): PerformanceReportResult {
  const cutoffTime = referenceDate.getTime() - timeframeDays * 24 * 60 * 60 * 1000;

  const filtered = posts.filter(
    (p) => new Date(p.publishedAt).getTime() >= cutoffTime
  );

  let totalViews = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;

  const enriched = filtered.map((p) => {
    totalViews += p.views;
    totalLikes += p.likes;
    totalComments += p.comments;
    totalShares += p.shares;

    const engRate =
      p.views > 0 ? (p.likes + p.comments + p.shares) / p.views : 0;

    return {
      ...p,
      engagementRate: Math.round(engRate * 1000) / 1000,
    };
  });

  const totalEngagements = totalLikes + totalComments + totalShares;
  const averageEngagementRate =
    totalViews > 0 ? Math.round((totalEngagements / totalViews) * 1000) / 1000 : 0;

  return {
    timeframeDays,
    postCount: enriched.length,
    totalViews,
    totalLikes,
    totalComments,
    totalShares,
    averageEngagementRate,
    posts: enriched,
  };
}

export function exportPerformanceReportCsv(report: PerformanceReportResult): string {
  const headers = [
    'ID',
    'PublishedAt',
    'HookType',
    'Duration',
    'Views',
    'Likes',
    'Comments',
    'Shares',
    'EngagementRate',
  ].join(',');

  const rows = report.posts.map((p) =>
    [
      p.id,
      p.publishedAt,
      p.hookType || 'STANDARD',
      p.durationSeconds || 0,
      p.views,
      p.likes,
      p.comments,
      p.shares,
      (p.engagementRate * 100).toFixed(2) + '%',
    ].join(',')
  );

  return [headers, ...rows].join('\n');
}
