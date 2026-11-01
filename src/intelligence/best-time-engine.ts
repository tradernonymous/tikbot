export interface PostMetricSample {
  id: string;
  publishedAt: string;
  viewsAt1h: number;
  viewsAt24h: number;
}

export interface BestTimeEngineInput {
  accountId: string;
  samples: PostMetricSample[];
  niche?: string;
}

export interface RecommendedTimeSlot {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  hourUtc: number; // 0 - 23
  velocityScore: number; // 0 - 100
  sampleCount: number;
}

export interface BestTimeEngineResult {
  accountId: string;
  hasSufficientData: boolean;
  sampleCount: number;
  provenance: 'live' | 'cached' | 'unknown';
  message?: string;
  recommendedSlots: RecommendedTimeSlot[];
  heatmapMatrix: number[][]; // 7 days x 24 hours (0-100 values)
}

const MINIMUM_SAMPLE_THRESHOLD = 10;

export function calculateBestPostingTimes(input: BestTimeEngineInput): BestTimeEngineResult {
  const sampleCount = input.samples?.length || 0;

  // Initialize empty 7x24 matrix
  const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  const counts: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

  if (sampleCount < MINIMUM_SAMPLE_THRESHOLD) {
    return {
      accountId: input.accountId,
      hasSufficientData: false,
      sampleCount,
      provenance: 'unknown',
      message: `Insufficient sample size (N=${sampleCount} < ${MINIMUM_SAMPLE_THRESHOLD}). Minimum 10 posts required for reliable recommendations.`,
      recommendedSlots: [],
      heatmapMatrix: matrix,
    };
  }

  // Populate matrix with T+1h views normalized against T+24h
  input.samples.forEach((sample) => {
    const d = new Date(sample.publishedAt);
    if (isNaN(d.getTime())) return;

    const day = d.getUTCDay();
    const hour = d.getUTCHours();

    // Early velocity ratio: how fast it accrued views in hour 1
    const velocity = sample.viewsAt24h > 0 ? (sample.viewsAt1h / sample.viewsAt24h) * 100 : 0;

    matrix[day][hour] += velocity;
    counts[day][hour] += 1;
  });

  const slots: RecommendedTimeSlot[] = [];

  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      if (counts[d][h] > 0) {
        const avgVelocity = Math.round(matrix[d][h] / counts[d][h]);
        matrix[d][h] = avgVelocity;
        slots.push({
          dayOfWeek: d,
          hourUtc: h,
          velocityScore: avgVelocity,
          sampleCount: counts[d][h],
        });
      }
    }
  }

  // Sort slots by velocityScore descending
  slots.sort((a, b) => b.velocityScore - a.velocityScore);

  return {
    accountId: input.accountId,
    hasSufficientData: true,
    sampleCount,
    provenance: 'live',
    recommendedSlots: slots.slice(0, 5),
    heatmapMatrix: matrix,
  };
}
