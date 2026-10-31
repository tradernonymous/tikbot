import { describe, it, expect } from 'vitest';
import {
  generatePostPerformanceReport,
  exportPerformanceReportCsv,
  PostPerformanceSample,
} from '../reports';

describe('Performance Reporting & Aggregation (G6.8)', () => {
  const now = new Date('2026-11-01T00:00:00.000Z').getTime();

  const samplePosts: PostPerformanceSample[] = [
    {
      id: 'p1',
      publishedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      views: 10000,
      likes: 1200,
      comments: 150,
      shares: 80,
      hookType: 'CONTRARIAN',
      durationSeconds: 32,
    },
    {
      id: 'p2',
      publishedAt: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      views: 25000,
      likes: 3100,
      comments: 400,
      shares: 210,
      hookType: 'QUESTION',
      durationSeconds: 45,
    },
  ];

  it('aggregates performance metrics filtered by timeframe days', () => {
    // 7 days window should only include p1
    const report7d = generatePostPerformanceReport(samplePosts, 7, new Date(now));
    expect(report7d.postCount).toBe(1);
    expect(report7d.totalViews).toBe(10000);
    expect(report7d.totalLikes).toBe(1200);

    // 30 days window should include both p1 and p2
    const report30d = generatePostPerformanceReport(samplePosts, 30, new Date(now));
    expect(report30d.postCount).toBe(2);
    expect(report30d.totalViews).toBe(35000);
    expect(report30d.averageEngagementRate).toBeGreaterThan(0.1);
  });

  it('exports report summary and per-post rows to valid CSV format', () => {
    const report = generatePostPerformanceReport(samplePosts, 30, new Date(now));
    const csv = exportPerformanceReportCsv(report);

    expect(csv).toContain('ID,PublishedAt,HookType,Duration,Views,Likes,Comments,Shares,EngagementRate');
    expect(csv).toContain('p1');
    expect(csv).toContain('CONTRARIAN');
  });
});
