import { describe, it, expect } from 'vitest';
import { segmentVideoTranscript, generateVttSubtitles } from '../repurpose';

describe('Content Repurposing Engine (G6.7)', () => {
  it('segments a long script into logical clips with hook and cta', () => {
    const longScript = `
      Stop wasting your ad budget on random targeting. Here is the exact blueprint we used to scale to 100k views.
      Step one is researching your competitor hooks using the outlier formula.
      Step two is creating three variations of the top performing hook.
      Save this video so you can execute this in your next campaign.
    `.trim();

    const clips = segmentVideoTranscript(longScript, { maxDurationSeconds: 60 });

    expect(clips.length).toBeGreaterThan(0);
    expect(clips[0].hasHook).toBe(true);
    expect(clips[0].estimatedDurationSeconds).toBeGreaterThan(0);
    expect(clips[0].estimatedDurationSeconds).toBeLessThanOrEqual(60);
  });

  it('generates standard WebVTT format for video subtitles', () => {
    const segments = [
      { startSeconds: 0, endSeconds: 2.5, text: 'Stop wasting your ad budget' },
      { startSeconds: 2.5, endSeconds: 5.0, text: 'Here is the exact blueprint' },
    ];

    const vtt = generateVttSubtitles(segments);

    expect(vtt).toContain('WEBVTT');
    expect(vtt).toContain('00:00:00.000 --> 00:00:02.500');
    expect(vtt).toContain('Stop wasting your ad budget');
    expect(vtt).toContain('00:00:02.500 --> 00:00:05.000');
  });
});
