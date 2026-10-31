import { describe, it, expect } from 'vitest';
import {
  analyzeTranscript,
  classifyHookType,
  type TranscriptAtom,
} from '../transcripts';

describe('Transcript Intelligence & Hook Decomposition', () => {
  it('classifies hook types accurately from the first sentence', () => {
    expect(classifyHookType('Stop making this huge mistake in your videos.')).toBe(
      'CONTRARIAN'
    );
    expect(classifyHookType('Did you know that 90% of creators fail because of this?')).toBe(
      'QUESTION'
    );
    expect(classifyHookType('Never post between 1am and 5am if you want views.')).toBe(
      'NEGATIVE_CONSTRAINT'
    );
    expect(classifyHookType('How I scaled to 100k followers in 30 days.')).toBe(
      'RESULT_STORY'
    );
    expect(classifyHookType('Today we are going to look at some product designs.')).toBe(
      'STANDARD'
    );
  });

  it('decomposes full transcript into hook, claims, and atomic insights', () => {
    const rawTranscript =
      'Stop making this huge mistake in your videos. You are spending 4 hours editing when the hook is terrible. The first 3 seconds dictate 80% of your retention. If you fix the opening sentence, your watch time will triple.';

    const analysis = analyzeTranscript(rawTranscript);

    expect(analysis.hookText).toBe('Stop making this huge mistake in your videos.');
    expect(analysis.hookType).toBe('CONTRARIAN');
    expect(analysis.claims.length).toBeGreaterThan(0);
    expect(analysis.wordCount).toBeGreaterThan(20);
    expect(analysis.atoms.length).toBeGreaterThan(0);
  });
});
