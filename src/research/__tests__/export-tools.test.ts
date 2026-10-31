import { describe, it, expect } from 'vitest';
import {
  exportPostsToCsv,
  exportPostsToJson,
  type ExportablePost,
} from '../export-tools';

describe('Research Export & Backup Tools', () => {
  const samplePosts: ExportablePost[] = [
    {
      id: 'post-101',
      platform: 'TIKTOK',
      authorHandle: 'growth_expert',
      caption: 'The "curiosity gap" formula, 10x your views!',
      viewCount: 150000,
      likeCount: 12000,
      commentCount: 450,
      shareCount: 890,
      outlierScore: 3.42,
      publishedAt: new Date('2026-01-15T12:00:00Z'),
    },
    {
      id: 'post-102',
      platform: 'DOUYIN',
      authorHandle: 'douyin_creator',
      caption: 'Viral cooking demonstration without talking',
      viewCount: 300000,
      likeCount: 28000,
      commentCount: 1100,
      shareCount: 4200,
      outlierScore: 5.18,
      publishedAt: new Date('2026-01-16T14:30:00Z'),
    },
  ];

  it('exports posts to valid CSV format with proper quoting and escaping', () => {
    const csv = exportPostsToCsv(samplePosts);

    expect(csv).toContain('ID,Platform,Author,Caption,Views,Likes,Comments,Shares,OutlierScore,PublishedAt');
    expect(csv).toContain('"post-101"');
    expect(csv).toContain('"The ""curiosity gap"" formula, 10x your views!"');
    expect(csv).toContain('150000');
    expect(csv).toContain('3.42');
  });

  it('exports posts to formatted JSON string', () => {
    const json = exportPostsToJson(samplePosts);
    const parsed = JSON.parse(json);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].id).toBe('post-101');
    expect(parsed[1].authorHandle).toBe('douyin_creator');
  });
});
