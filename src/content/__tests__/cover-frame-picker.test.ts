import { describe, it, expect } from 'vitest';
import {
  extractCandidateCoverFrames,
  CoverFramePickerInput,
} from '../cover-frame-picker';

describe('A3.6 Cover Frame Picker (Contrast + Face Heuristics)', () => {
  it('extracts candidate frames and ranks by composite contrast and engagement score', () => {
    const input: CoverFramePickerInput = {
      videoDurationSeconds: 45,
      sampleCount: 6,
      videoAssetPath: '/storage/renders/sample.mp4',
    };

    const frames = extractCandidateCoverFrames(input);

    expect(frames).toHaveLength(6);

    // One frame is flagged recommended as best cover
    const recommended = frames.filter((f) => f.isRecommended);
    expect(recommended).toHaveLength(1);

    frames.forEach((f) => {
      expect(f.timestampSeconds).toBeGreaterThanOrEqual(0);
      expect(f.timestampSeconds).toBeLessThanOrEqual(45);
      expect(f.compositeScore).toBeGreaterThanOrEqual(0);
      expect(f.compositeScore).toBeLessThanOrEqual(100);
      expect(f.thumbnailUrl).toContain('frame');
    });
  });
});
