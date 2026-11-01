export type HashtagTier = 'BROAD' | 'MID' | 'NICHE';

export interface HashtagSuggesterInput {
  topic: string;
  trendRadarTags?: { tag: string; risingScore: number; volume: number }[];
  ownPostTagPerformance?: { tag: string; avgViews: number; postCount: number }[];
}

export interface HashtagSuggestion {
  tag: string;
  tier: HashtagTier;
  confidenceScore: number;
  decayWarning?: boolean;
  reason: string;
}

export interface HashtagPortfolioResult {
  recommendedTags: HashtagSuggestion[];
  mixRatio: { broad: number; mid: number; niche: number };
  formattedCaptionAppend: string;
}

export function suggestHashtagPortfolio(input: HashtagSuggesterInput): HashtagPortfolioResult {
  const radarTags = input.trendRadarTags || [];
  const ownPerformance = new Map(
    (input.ownPostTagPerformance || []).map((p) => [p.tag.toLowerCase(), p.avgViews])
  );

  const suggestions: HashtagSuggestion[] = radarTags.map((t) => {
    const cleanTag = t.tag.startsWith('#') ? t.tag : `#${t.tag}`;
    const volume = t.volume || 50000;

    let tier: HashtagTier = 'MID';
    if (volume >= 1000000) {
      tier = 'BROAD';
    } else if (volume < 100000) {
      tier = 'NICHE';
    }

    const isDecayed = t.risingScore < 25;
    const ownBoost = ownPerformance.has(cleanTag.toLowerCase()) ? 15 : 0;
    const confidenceScore = Math.min(99, Math.max(30, t.risingScore + ownBoost));

    let reason = `${tier} tag with ${t.risingScore} rising velocity`;
    if (ownBoost > 0) {
      reason += ' (proven high views in your own posts)';
    }
    if (isDecayed) {
      reason += ' [Decay warning: momentum dropped]';
    }

    return {
      tag: cleanTag,
      tier,
      confidenceScore,
      decayWarning: isDecayed,
      reason,
    };
  });

  // Calculate ratio
  const broadCount = suggestions.filter((s) => s.tier === 'BROAD').length;
  const midCount = suggestions.filter((s) => s.tier === 'MID').length;
  const nicheCount = suggestions.filter((s) => s.tier === 'NICHE').length;
  const total = Math.max(1, suggestions.length);

  const formattedCaptionAppend = suggestions
    .filter((s) => !s.decayWarning)
    .map((s) => s.tag)
    .join(' ');

  return {
    recommendedTags: suggestions,
    mixRatio: {
      broad: Math.round((broadCount / total) * 100),
      mid: Math.round((midCount / total) * 100),
      niche: Math.round((nicheCount / total) * 100),
    },
    formattedCaptionAppend,
  };
}
