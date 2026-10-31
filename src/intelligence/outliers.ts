export interface VideoPerformanceMetric {
  id: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface OutlierAnalysisResult {
  id: string;
  views: number;
  engagementRate: number;
  outlierMultiplier: number;
  isOutlier: boolean;
}

export function calculateEngagementRate(metric: {
  views: number;
  likes: number;
  comments: number;
  shares: number;
}): number {
  if (metric.views <= 0) return 0;
  // Weighted: likes(1) + comments(2) + shares(3)
  const weightedEngagements = metric.likes * 1 + metric.comments * 2 + metric.shares * 3;
  return weightedEngagements / metric.views;
}

export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function detectOutliers(
  posts: VideoPerformanceMetric[],
  threshold = 2.5
): OutlierAnalysisResult[] {
  if (posts.length === 0) return [];

  const allViews = posts.map((p) => p.views);
  const medianViews = calculateMedian(allViews);

  const engagementRates = posts.map((p) => calculateEngagementRate(p));
  const medianEngagement = calculateMedian(engagementRates);

  return posts.map((post, idx) => {
    const rate = engagementRates[idx];
    const viewRatio = medianViews > 0 ? post.views / medianViews : 1;
    const engRatio = medianEngagement > 0 ? rate / medianEngagement : 1;

    // Outlier multiplier combines view velocity and engagement resonance
    const outlierMultiplier = Number((viewRatio * Math.sqrt(engRatio)).toFixed(2));
    const isOutlier = outlierMultiplier >= threshold;

    return {
      id: post.id,
      views: post.views,
      engagementRate: Number(rate.toFixed(4)),
      outlierMultiplier,
      isOutlier,
    };
  });
}
