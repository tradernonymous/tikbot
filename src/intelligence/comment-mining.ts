export type CommentIntent =
  | 'QUESTION'
  | 'OBJECTION'
  | 'PAIN_POINT'
  | 'PRODUCT_DEMAND'
  | 'PRAISE'
  | 'GENERAL';

export interface ScrapedComment {
  id: string;
  text: string;
  likeCount?: number;
  authorHandle?: string;
}

export interface VocSummaryReport {
  totalAnalyzed: number;
  questions: ScrapedComment[];
  objections: ScrapedComment[];
  painPoints: ScrapedComment[];
  productDemands: ScrapedComment[];
  praise: ScrapedComment[];
}

export function classifyCommentIntent(text: string): CommentIntent {
  const lower = text.toLowerCase();

  // 1. Product demand & purchasing intent
  if (
    lower.includes('where to buy') ||
    lower.includes('where can i buy') ||
    lower.includes('drop the link') ||
    lower.includes('link to purchase') ||
    lower.includes('link?') ||
    lower.includes('how much is it') ||
    lower.includes('take my money')
  ) {
    return 'PRODUCT_DEMAND';
  }

  // 2. Objections & skepticism
  if (
    lower.includes('scam') ||
    lower.includes('too expensive') ||
    lower.includes('waste of money') ||
    lower.includes('fake') ||
    lower.includes('does not work') ||
    lower.includes("doesn't work") ||
    lower.includes('zero results')
  ) {
    return 'OBJECTION';
  }

  // 3. Pain points & struggles
  if (
    lower.includes('struggle with') ||
    lower.includes('i hate when') ||
    lower.includes('so hard to') ||
    lower.includes('frustrated') ||
    lower.includes('always fail at')
  ) {
    return 'PAIN_POINT';
  }

  // 4. Questions
  if (
    lower.includes('?') ||
    lower.startsWith('how ') ||
    lower.startsWith('what ') ||
    lower.startsWith('where ') ||
    lower.startsWith('why ') ||
    lower.startsWith('is this')
  ) {
    return 'QUESTION';
  }

  // 5. Praise & validation
  if (
    lower.includes('fire') ||
    lower.includes('🔥') ||
    lower.includes('love this') ||
    lower.includes('best tutorial') ||
    lower.includes('amazing') ||
    lower.includes('game changer')
  ) {
    return 'PRAISE';
  }

  return 'GENERAL';
}

export function clusterCommentsForVoc(comments: ScrapedComment[]): VocSummaryReport {
  const report: VocSummaryReport = {
    totalAnalyzed: comments.length,
    questions: [],
    objections: [],
    painPoints: [],
    productDemands: [],
    praise: [],
  };

  for (const comment of comments) {
    const intent = classifyCommentIntent(comment.text);
    switch (intent) {
      case 'PRODUCT_DEMAND':
        report.productDemands.push(comment);
        break;
      case 'OBJECTION':
        report.objections.push(comment);
        break;
      case 'PAIN_POINT':
        report.painPoints.push(comment);
        break;
      case 'QUESTION':
        report.questions.push(comment);
        break;
      case 'PRAISE':
        report.praise.push(comment);
        break;
      default:
        break;
    }
  }

  return report;
}
