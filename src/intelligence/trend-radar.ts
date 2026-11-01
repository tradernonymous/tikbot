export interface TrendVolumeParams {
  currentVolume: number;
  previousVolume: number;
  hoursDiff: number;
}

export function calculateRisingScore({
  currentVolume,
  previousVolume,
  hoursDiff,
}: TrendVolumeParams): number {
  if (previousVolume <= 0 || hoursDiff <= 0) {
    return Math.min(100, Math.round(Math.log10(Math.max(currentVolume, 1)) * 15));
  }

  const growthRate = (currentVolume - previousVolume) / previousVolume;
  const hourlyRate = growthRate / hoursDiff;

  // Normalized exponential scoring capped at 100
  const score = Math.round(Math.min(100, Math.max(0, 50 + hourlyRate * 400)));
  return score;
}

export interface TrendHashtagSample {
  id: string;
  tags: string[];
}

export interface CoOccurrenceResult {
  tag: string;
  count: number;
}

export function analyzeHashtagCoOccurrence(
  samples: TrendHashtagSample[],
  primaryTag: string
): CoOccurrenceResult[] {
  const normalizedPrimary = primaryTag.toLowerCase().replace(/^#/, '');
  const counts: Record<string, number> = {};

  for (const sample of samples) {
    const normalizedTags = sample.tags.map((t) => t.toLowerCase().replace(/^#/, ''));
    if (!normalizedTags.includes(normalizedPrimary)) {
      continue;
    }

    for (const tag of normalizedTags) {
      if (tag === normalizedPrimary) continue;
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }

  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export type SoundLifecyclePhase = 'EMERGING' | 'RISING' | 'PEAK' | 'DECLINING';

export function detectSoundLifecycle(
  velocity: number,
  sampleSize: number
): SoundLifecyclePhase {
  if (sampleSize < 10) {
    return 'EMERGING';
  }
  if (velocity > 15) {
    return 'RISING';
  }
  if (velocity < 0) {
    return 'DECLINING';
  }
  return 'PEAK';
}
