export interface ExportablePost {
  id: string;
  platform: string;
  authorHandle: string;
  caption: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  outlierScore: number;
  publishedAt: Date;
}

function escapeCsvField(val: string | number | Date | null | undefined): string {
  if (val === null || val === undefined) return '""';
  if (val instanceof Date) return `"${val.toISOString()}"`;
  const str = String(val);
  // Double quotes escape to ""
  return `"${str.replace(/"/g, '""')}"`;
}

export function exportPostsToCsv(posts: ExportablePost[]): string {
  const headers = [
    'ID',
    'Platform',
    'Author',
    'Caption',
    'Views',
    'Likes',
    'Comments',
    'Shares',
    'OutlierScore',
    'PublishedAt',
  ].join(',');

  const rows = posts.map((p) =>
    [
      escapeCsvField(p.id),
      escapeCsvField(p.platform),
      escapeCsvField(p.authorHandle),
      escapeCsvField(p.caption),
      p.viewCount,
      p.likeCount,
      p.commentCount,
      p.shareCount,
      p.outlierScore.toFixed(2),
      escapeCsvField(p.publishedAt),
    ].join(',')
  );

  return [headers, ...rows].join('\n');
}

export function exportPostsToJson(posts: ExportablePost[]): string {
  return JSON.stringify(posts, null, 2);
}
