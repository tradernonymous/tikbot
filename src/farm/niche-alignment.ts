export interface FeedSampleItem {
  id: string;
  hashtags: string[];
  author: string;
}

export interface AlignmentResult {
  accountId: string;
  alignmentScore: number; // 0 to 100
  sampleSize: number;
  matchedCount: number;
  eligibleForBoostCohort: boolean;
  threshold: number;
  provenance: 'live' | 'stale';
}

export class NicheAlignmentScorer {
  calculateAlignment(
    accountId: string,
    targetKeywords: string[],
    feedSample: FeedSampleItem[],
    threshold = 70
  ): AlignmentResult {
    if (feedSample.length === 0) {
      return {
        accountId,
        alignmentScore: 0,
        sampleSize: 0,
        matchedCount: 0,
        eligibleForBoostCohort: false,
        threshold,
        provenance: 'live',
      };
    }

    const lowerTargets = targetKeywords.map((k) => k.toLowerCase().replace('#', ''));

    let matched = 0;
    for (const item of feedSample) {
      const itemTags = item.hashtags.map((t) => t.toLowerCase().replace('#', ''));
      const isMatch = itemTags.some((tag) => lowerTargets.includes(tag));
      if (isMatch) {
        matched++;
      }
    }

    const alignmentScore = Math.round((matched / feedSample.length) * 100);

    return {
      accountId,
      alignmentScore,
      sampleSize: feedSample.length,
      matchedCount: matched,
      eligibleForBoostCohort: alignmentScore >= threshold,
      threshold,
      provenance: 'live',
    };
  }
}
