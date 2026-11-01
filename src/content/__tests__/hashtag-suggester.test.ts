import { describe, it, expect } from 'vitest';
import {
  suggestHashtagPortfolio,
  HashtagSuggesterInput,
} from '../hashtag-suggester';

describe('A3.5 Hashtag Portfolio Optimizer & Suggester v2', () => {
  it('generates a balanced broad/mid/niche portfolio from trend radar and own performance', () => {
    const input: HashtagSuggesterInput = {
      topic: 'Faceless Content Automation',
      trendRadarTags: [
        { tag: '#automation', risingScore: 95, volume: 5000000 },
        { tag: '#facelesschannel', risingScore: 92, volume: 450000 },
        { tag: '#contentcreator2026', risingScore: 89, volume: 35000 },
        { tag: '#oldtrend', risingScore: 12, volume: 80000 }, // Decayed tag
      ],
      ownPostTagPerformance: [
        { tag: '#facelesschannel', avgViews: 120000, postCount: 5 },
      ],
    };

    const result = suggestHashtagPortfolio(input);

    expect(result.recommendedTags.length).toBeGreaterThanOrEqual(3);

    // Verify portfolio tier distribution
    const tiers = result.recommendedTags.map((t) => t.tier);
    expect(tiers).toContain('BROAD');
    expect(tiers).toContain('MID');
    expect(tiers).toContain('NICHE');

    // Check decay warning on low rising score tag
    const decayed = result.recommendedTags.find((t) => t.tag === '#oldtrend');
    if (decayed) {
      expect(decayed.decayWarning).toBe(true);
    }

    // Formatted caption append ready for one-click insert into composer
    expect(result.formattedCaptionAppend).toMatch(/^#\w+( #\w+)*$/);
  });
});
