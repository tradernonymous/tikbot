import { prisma } from '@/lib/prisma';
import { scoreOutlierAgainstBaseline } from '@/intelligence/outliers';

/**
 * R2.6 — persist outlier score on ResearchPost using the Creator baseline:
 * the same creator's other posts' views (median + MAD + sample size),
 * scored by median ratio (2.5x threshold, median from stored data).
 * Honest semantics: `outlierScore` = targetViews / median baseline.
 */
export async function applyBaselineOutlierScore(postId: string): Promise<void> {
  try {
    const post = await prisma.researchPost.findUnique({
      where: { id: postId },
      include: { creator: true },
    });
    if (!post?.creator) return;

    // Baseline views: the same creator's other posts (sample of 50).
    const siblings = await prisma.researchPost.findMany({
      where: { creatorId: post.creator.id, id: { not: post.id } },
      take: 50,
    });
    const baselineViews = siblings.map((p) => p.viewCount).filter((v) => v > 0);

    const result = scoreOutlierAgainstBaseline(post.viewCount, baselineViews, 5, 2.5);
    if (result.hasSufficientBaseline) {
      await prisma.researchPost.update({
        where: { id: postId },
        data: {
          outlierScore: result.outlierScore,
          medianBaseline: result.median,
          confidence: result.confidence,
        },
      });
    }
  } catch {
    // scoring is best-effort
  }
}
