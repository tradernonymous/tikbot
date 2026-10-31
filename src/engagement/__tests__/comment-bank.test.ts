import { describe, it, expect } from 'vitest';
import {
  generateRelatableComment,
  type CommentPersona,
} from '../comment-bank';

describe('Comment Bank & Relatable Template Engine', () => {
  it('generates non-empty relatable comments for all supported personas', () => {
    const personas: CommentPersona[] = ['ENTHUSIAST', 'INQUIRER', 'CONVERTED_SKEPTIC', 'SUPPORTER'];

    for (const persona of personas) {
      const comment = generateRelatableComment({ persona });
      expect(comment).toBeDefined();
      expect(comment.length).toBeGreaterThan(10);
    }
  });

  it('interpolates topic and niche context into template when provided', () => {
    const comment = generateRelatableComment({
      persona: 'INQUIRER',
      context: 'hook editing',
    });

    expect(comment).toContain('hook editing');
  });

  it('produces variety over multiple calls without identical repetition', () => {
    const results = new Set<string>();
    for (let i = 0; i < 10; i++) {
      results.add(generateRelatableComment({ persona: 'ENTHUSIAST' }));
    }

    expect(results.size).toBeGreaterThan(1);
  });
});
