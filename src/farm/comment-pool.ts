export function normalizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function isCommentDuplicateOrTooSimilar(text1: string, text2: string): boolean {
  const words1 = normalizeText(text1);
  const words2 = normalizeText(text2);

  if (words1.length === 0 || words2.length === 0) return false;

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  let intersection = 0;
  for (const w of set1) {
    if (set2.has(w)) intersection++;
  }

  const union = new Set([...words1, ...words2]).size;
  const jaccard = intersection / union;

  return jaccard >= 0.75;
}

export class CommentQualityPool {
  private keywords: string[];
  private usedComments = new Map<string, string[]>(); // targetPostId -> comments[]

  constructor(options: { nicheKeywords: string[] }) {
    this.keywords = options.nicheKeywords;
  }

  generateUniqueComment(targetPostId: string, accountId: string): string {
    const kw1 = this.keywords[0] || 'strategy';
    const kw2 = this.keywords[1] || 'content';

    const templates = [
      `The breakdown on ${kw1} was super clear. Nice work!`,
      `Interesting angle on ${kw2}. How does this scale for smaller accounts?`,
      `Quality insights here. Saving this for reference!`,
      `What was the biggest learning curve with ${kw1}?`,
      `Solid points on ${kw2}, definitely testing this out this week.`,
    ];

    const pastComments = this.usedComments.get(targetPostId) || [];
    const seed = accountId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

    for (let i = 0; i < templates.length; i++) {
      const candidate = templates[(seed + i) % templates.length];
      const isDuplicate = pastComments.some((past) =>
        isCommentDuplicateOrTooSimilar(past, candidate)
      );

      if (!isDuplicate) {
        pastComments.push(candidate);
        this.usedComments.set(targetPostId, pastComments);
        return candidate;
      }
    }

    // Fallback with unique discriminator if pool exhausted
    const fallback = `Really great perspective on ${kw1}! #${accountId.slice(-4)}`;
    pastComments.push(fallback);
    this.usedComments.set(targetPostId, pastComments);
    return fallback;
  }
}
