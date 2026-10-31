import { describe, it, expect } from 'vitest';
import {
  classifyCommentIntent,
  clusterCommentsForVoc,
  type ScrapedComment,
} from '../comment-mining';

describe('Comment Mining & VOC Extraction', () => {
  it('classifies comments into precise intent categories', () => {
    expect(classifyCommentIntent('How do I set up the tracking pixel on my shop?')).toBe('QUESTION');
    expect(classifyCommentIntent('This is a total scam, tried it and got zero results.')).toBe('OBJECTION');
    expect(classifyCommentIntent('I struggle with getting views on my first 5 videos so much.')).toBe('PAIN_POINT');
    expect(classifyCommentIntent('Where can I buy this template? Drop the link!')).toBe('PRODUCT_DEMAND');
    expect(classifyCommentIntent('This is the best tutorial I have seen all month, fire! 🔥')).toBe('PRAISE');
    expect(classifyCommentIntent('Nice video')).toBe('GENERAL');
  });

  it('clusters comments into actionable VOC summary report', () => {
    const comments: ScrapedComment[] = [
      { id: 'c1', text: 'Where can I buy this tool?' },
      { id: 'c2', text: 'Link to purchase please?' },
      { id: 'c3', text: 'How do I install the proxy correctly?' },
      { id: 'c4', text: 'Is this too expensive for beginners?' },
      { id: 'c5', text: 'I struggle with retention on short form.' },
      { id: 'c6', text: 'Love this content!' },
    ];

    const voc = clusterCommentsForVoc(comments);

    expect(voc.productDemands).toHaveLength(2);
    expect(voc.questions).toHaveLength(1);
    expect(voc.objections).toHaveLength(1);
    expect(voc.painPoints).toHaveLength(1);
    expect(voc.totalAnalyzed).toBe(6);
  });
});
