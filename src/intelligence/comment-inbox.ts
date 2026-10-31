export type CommentCategory = 'QUESTION' | 'OBJECTION' | 'PRAISE' | 'SPAM' | 'GENERAL';

export function categorizeComment(text: string): CommentCategory {
  const lower = text.toLowerCase().trim();

  // Spam signals
  if (
    lower.includes('crypto') ||
    lower.includes('free $$$') ||
    lower.includes('check out my profile') ||
    lower.includes('telegram') ||
    lower.includes('dm me')
  ) {
    return 'SPAM';
  }

  // Question signals
  if (
    lower.includes('?') ||
    lower.startsWith('where') ||
    lower.startsWith('how') ||
    lower.startsWith('what') ||
    lower.startsWith('why') ||
    lower.startsWith('can you')
  ) {
    return 'QUESTION';
  }

  // Objection signals
  if (
    lower.includes('scam') ||
    lower.includes('fake') ||
    lower.includes('does not work') ||
    lower.includes("doesn't work") ||
    lower.includes('waste of time') ||
    lower.includes('cap') ||
    lower.includes('lies')
  ) {
    return 'OBJECTION';
  }

  // Praise signals
  if (
    lower.includes('amazing') ||
    lower.includes('love this') ||
    lower.includes('great') ||
    lower.includes('helpful') ||
    lower.includes('fire') ||
    lower.includes('best') ||
    lower.includes('blew up')
  ) {
    return 'PRAISE';
  }

  return 'GENERAL';
}

const POSITIVE_WORDS = ['amazing', 'love', 'great', 'helpful', 'fire', 'best', 'good', 'super', 'awesome', 'thank'];
const NEGATIVE_WORDS = ['terrible', 'scam', 'fake', 'worst', 'hate', 'bad', 'waste', 'broken', 'lies', 'trash'];

export function scoreSentiment(text: string): number {
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  if (words.length === 0) return 0;

  let posCount = 0;
  let negCount = 0;

  for (const w of words) {
    if (POSITIVE_WORDS.includes(w)) posCount++;
    if (NEGATIVE_WORDS.includes(w)) negCount++;
  }

  const total = posCount + negCount;
  if (total === 0) return 0;

  return Math.round(((posCount - negCount) / total) * 100) / 100;
}

export interface PendingReplyInput {
  commentId: string;
  replyText: string;
}

export interface PendingReply {
  id: string;
  commentId: string;
  replyText: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'POSTED';
  createdAt: string;
}

export function createPendingReply(input: PendingReplyInput): PendingReply {
  return {
    id: `reply_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    commentId: input.commentId,
    replyText: input.replyText,
    status: 'PENDING_APPROVAL',
    createdAt: new Date().toISOString(),
  };
}
