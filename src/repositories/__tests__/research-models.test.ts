import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('R2.1 Research and Metric Prisma Models Schema & Validation', () => {
  const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');

  it('defines ResearchPost with @@unique([platform, platformPostId])', () => {
    expect(schemaContent).toContain('model ResearchPost {');
    expect(schemaContent).toContain('platformPostId');
    expect(schemaContent).toContain('@@unique([platform, platformPostId])');
  });

  it('defines PostSnapshot with capturedAt and relation to ResearchPost', () => {
    expect(schemaContent).toContain('model PostSnapshot {');
    expect(schemaContent).toContain('capturedAt');
    expect(schemaContent).toContain('post       ResearchPost');
  });

  it('defines Creator with baseline statistics and unique handle per platform', () => {
    expect(schemaContent).toContain('model Creator {');
    expect(schemaContent).toContain('medianViews');
    expect(schemaContent).toContain('madViews');
    expect(schemaContent).toContain('@@unique([platform, handle])');
  });

  it('defines Watchlist and WatchlistTarget models', () => {
    expect(schemaContent).toContain('model Watchlist {');
    expect(schemaContent).toContain('model WatchlistTarget {');
    expect(schemaContent).toContain('pollIntervalHours');
  });

  it('defines TrendSignal, Sound, and Hook models', () => {
    expect(schemaContent).toContain('model TrendSignal {');
    expect(schemaContent).toContain('@@unique([type, signalKey, region])');
    expect(schemaContent).toContain('model Sound {');
    expect(schemaContent).toContain('@@unique([platform, platformSoundId])');
    expect(schemaContent).toContain('model Hook {');
    expect(schemaContent).toContain('retentionProxyScore');
  });

  it('defines ContentPlan and MetricSample models', () => {
    expect(schemaContent).toContain('model ContentPlan {');
    expect(schemaContent).toContain('model MetricSample {');
    expect(schemaContent).toContain('@@index([targetType, targetId, timestamp])');
  });
});
