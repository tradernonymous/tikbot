import { describe, it, expect } from 'vitest';
import {
  categorizeComment,
  scoreSentiment,
  createPendingReply,
} from '../comment-inbox';

describe('Comment Inbox Intelligence & Safety Gate (G6.10)', () => {
  it('categorizes incoming comments into actionable types', () => {
    expect(categorizeComment('Where can I get the link for this?')).toBe('QUESTION');
    expect(categorizeComment('This looks like a complete scam, does not work')).toBe('OBJECTION');
    expect(categorizeComment('Amazing advice, tried this yesterday and it blew up!')).toBe('PRAISE');
    expect(categorizeComment('Check out my profile for free crypto $$$')).toBe('SPAM');
  });

  it('scores sentiment from positive to negative accurately', () => {
    const positive = scoreSentiment('Amazing content, absolutely loved this!');
    const negative = scoreSentiment('Terrible, waste of time and complete scam.');

    expect(positive).toBeGreaterThan(0.3);
    expect(negative).toBeLessThan(-0.3);
  });

  it('queues replies in PENDING_APPROVAL status to satisfy compliance gate', () => {
    const reply = createPendingReply({
      commentId: 'c-123',
      replyText: 'Check the link in bio for the free guide!',
    });

    expect(reply.status).toBe('PENDING_APPROVAL');
    expect(reply.replyText).toContain('link in bio');
  });
});
