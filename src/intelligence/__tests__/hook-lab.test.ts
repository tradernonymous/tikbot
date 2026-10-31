import { describe, it, expect } from 'vitest';
import { generateHookVariants, evaluateABHookTest } from '../hook-lab';

describe('Hook Lab & A/B Hooks Engine (G6.3, G6.6)', () => {
  it('generates hook variants across standard psychological archetypes', () => {
    const base = 'Grow your TikTok audience with organic content';
    const variants = generateHookVariants(base);

    expect(variants.length).toBeGreaterThanOrEqual(4);
    expect(variants.some((v) => v.type === 'CONTRARIAN')).toBe(true);
    expect(variants.some((v) => v.type === 'QUESTION')).toBe(true);
    expect(variants.some((v) => v.type === 'NEGATIVE_CONSTRAINT')).toBe(true);
    expect(variants.some((v) => v.type === 'RESULT_STORY')).toBe(true);
  });

  it('evaluates A/B hook variant test and declares winner when confidence threshold is met', () => {
    const result = evaluateABHookTest(
      { id: 'variant-A', views: 5000, retentionRate: 0.18 },
      { id: 'variant-B', views: 8200, retentionRate: 0.34 }
    );

    expect(result.winnerId).toBe('variant-B');
    expect(result.liftPercentage).toBeGreaterThan(50);
    expect(result.isSignificant).toBe(true);
  });

  it('declares no significant winner when lift is within noise margin', () => {
    const result = evaluateABHookTest(
      { id: 'variant-A', views: 5000, retentionRate: 0.20 },
      { id: 'variant-B', views: 5050, retentionRate: 0.205 }
    );

    expect(result.isSignificant).toBe(false);
  });
});
