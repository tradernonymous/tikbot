export type HookPatternType = 'QUESTION' | 'POV' | 'CONTRARIAN' | 'DEMO';

export interface ScriptGeneratorInput {
  topic: string;
  hookPattern?: HookPatternType;
  sourceType?: 'TREND_SIGNAL' | 'VOC_THEME' | 'OUTLIER';
  keywords?: string[];
}

export interface ScriptVariant {
  id: string;
  hookPattern: HookPatternType;
  hookText: string;
  bodyText: string;
  callToAction: string;
  fullScript: string;
  retentionScore: number;
  wordCount: number;
  estimatedDurationSeconds: number;
}

const PATTERN_CONFIG: Record<
  HookPatternType,
  {
    score: number;
    hookBuilder: (topic: string) => string;
    bodyBuilder: (topic: string, keywords: string[]) => string;
    ctaBuilder: () => string;
  }
> = {
  CONTRARIAN: {
    score: 92,
    hookBuilder: (topic) => `Stop doing this wrong: the real truth about ${topic} will blow your mind.`,
    bodyBuilder: (topic, kw) =>
      `Most creators waste hours because they follow outdated advice on ${topic}. Instead, leverage ${
        kw.length ? kw.join(' and ') : 'automated systems'
      } to cut your workload by 80%. Here is the exact blueprint.`,
    ctaBuilder: () => `Save this before the algorithm buries it and follow for part 2.`,
  },
  POV: {
    score: 88,
    hookBuilder: (topic) => `POV: You finally mastered ${topic} and your entire workflow changed.`,
    bodyBuilder: (topic, kw) =>
      `No more guessing or manual grind. By focusing strictly on ${
        kw.length ? kw[0] : 'high leverage execution'
      }, you skip months of trial and error. Here is what you need to start right now.`,
    ctaBuilder: () => `Drop a comment with your niche and I'll send you the breakdown.`,
  },
  QUESTION: {
    score: 84,
    hookBuilder: (topic) => `Why is nobody in this space talking about ${topic}?`,
    bodyBuilder: (topic, kw) =>
      `Here is what top 1% accounts do behind the scenes with ${topic}. They set up ${
        kw.length ? kw.join(', ') : 'smart presets'
      } and publish with zero friction.`,
    ctaBuilder: () => `Hit the link in bio to copy this exact template today.`,
  },
  DEMO: {
    score: 81,
    hookBuilder: (topic) => `Watch how fast you can scale ${topic} in under 30 seconds.`,
    bodyBuilder: (topic, kw) =>
      `Step one: pick your trigger. Step two: run the sequence with ${
        kw.length ? kw[0] : 'one click'
      }. Step three: sit back and watch the results.`,
    ctaBuilder: () => `Share this with a creator who needs to see this.`,
  },
};

export async function generateScriptVariants(
  input: ScriptGeneratorInput
): Promise<ScriptVariant[]> {
  const allPatterns: HookPatternType[] = ['CONTRARIAN', 'POV', 'QUESTION', 'DEMO'];

  // If user preferred a pattern, put it first
  const orderedPatterns: HookPatternType[] = input.hookPattern
    ? [input.hookPattern, ...allPatterns.filter((p) => p !== input.hookPattern)]
    : allPatterns;

  const top3Patterns = orderedPatterns.slice(0, 3);
  const keywords = input.keywords || [];

  return top3Patterns.map((pattern, index) => {
    const config = PATTERN_CONFIG[pattern];
    const hookText = config.hookBuilder(input.topic);
    const bodyText = config.bodyBuilder(input.topic, keywords);
    const callToAction = config.ctaBuilder();
    const fullScript = `${hookText}\n\n${bodyText}\n\n${callToAction}`;

    const words = fullScript.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    // ~2.5 words per second
    const estimatedDurationSeconds = Math.round((wordCount / 2.5) * 10) / 10;

    return {
      id: `script-${pattern.toLowerCase()}-${Date.now()}-${index}`,
      hookPattern: pattern,
      hookText,
      bodyText,
      callToAction,
      fullScript,
      retentionScore: config.score,
      wordCount,
      estimatedDurationSeconds,
    };
  });
}
