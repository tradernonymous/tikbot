import { describe, it, expect } from 'vitest';
import { generateScriptVariants, ScriptGeneratorInput } from '../script-generator';

describe('A3.2 Script Generator (Pattern-Scored Variants)', () => {
  it('generates 3 distinct script variants scored by Hook Lab patterns', async () => {
    const input: ScriptGeneratorInput = {
      topic: 'AI Automation for Creators',
      sourceType: 'TREND_SIGNAL',
      keywords: ['schedule', 'workflow', 'save time'],
    };

    const variants = await generateScriptVariants(input);

    expect(variants).toHaveLength(3);

    // Each variant has distinct pattern
    const patterns = variants.map((v) => v.hookPattern);
    expect(new Set(patterns).size).toBe(3);

    variants.forEach((v) => {
      expect(v.hookText.length).toBeGreaterThan(5);
      expect(v.bodyText.length).toBeGreaterThan(10);
      expect(v.callToAction.length).toBeGreaterThan(3);
      expect(v.fullScript).toContain(v.hookText);
      expect(v.retentionScore).toBeGreaterThanOrEqual(50);
      expect(v.retentionScore).toBeLessThanOrEqual(100);
      expect(v.estimatedDurationSeconds).toBeGreaterThan(0);
    });
  });

  it('respects requested primary hookPattern if specified', async () => {
    const input: ScriptGeneratorInput = {
      topic: 'Midnight Coding Hacks',
      hookPattern: 'CONTRARIAN',
    };

    const variants = await generateScriptVariants(input);
    expect(variants[0].hookPattern).toBe('CONTRARIAN');
  });
});
