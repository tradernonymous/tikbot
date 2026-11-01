import { describe, it, expect } from 'vitest';
import {
  extractRankedClips,
  convertClipToVariant,
  SmartClippingInput,
} from '../smart-clipping';

describe('A3.4 Smart Clipping (Whisper + Highlight Detection)', () => {
  const sampleSegments = [
    { startSeconds: 0, endSeconds: 4, text: 'Hey guys, welcome back to the channel today.' },
    { startSeconds: 4.5, endSeconds: 9.0, text: 'Stop doing this mistake with your morning schedule.' },
    { startSeconds: 9.5, endSeconds: 25.0, text: 'If you check your phone in the first 10 minutes, your cortisol spikes 50%.' },
    { startSeconds: 25.5, endSeconds: 40.0, text: 'Here is what neuroscientists recommend instead for maximum focus.' },
    { startSeconds: 40.5, endSeconds: 45.0, text: 'Follow for more neuroscience-backed daily habits.' },
    { startSeconds: 46.0, endSeconds: 55.0, text: 'Also check out our sponsor link in the description below.' },
  ];

  it('ranks clip candidates with precise hook timestamps and virality score', () => {
    const input: SmartClippingInput = {
      videoTitle: 'Full Podcast: Daily Neurobiology Habits',
      segments: sampleSegments,
      minDurationSeconds: 15,
      maxDurationSeconds: 60,
    };

    const clips = extractRankedClips(input);

    expect(clips.length).toBeGreaterThanOrEqual(1);

    const topClip = clips[0];
    expect(topClip.startSeconds).toBe(4.5); // Starts right at the hook, skipping intro fluff!
    expect(topClip.hookText).toContain('Stop doing this mistake');
    expect(topClip.hookTimestampSeconds).toBe(4.5);
    expect(topClip.viralityScore).toBeGreaterThanOrEqual(80);
    expect(topClip.durationSeconds).toBeLessThanOrEqual(60);
  });

  it('converts ranked clip to variant with platform caption preset', () => {
    const clip = {
      id: 'clip-1',
      title: 'Stop doing this mistake with your morning schedule',
      startSeconds: 4.5,
      endSeconds: 45.0,
      durationSeconds: 40.5,
      hookTimestampSeconds: 4.5,
      hookText: 'Stop doing this mistake with your morning schedule',
      highlightReason: 'High urgency hook + concrete statistic',
      viralityScore: 94,
    };

    const variant = convertClipToVariant(clip, { platform: 'TIKTOK' });

    expect(variant.clipId).toBe('clip-1');
    expect(variant.platform).toBe('TIKTOK');
    expect(variant.caption).toContain(clip.hookText);
    expect(variant.durationSeconds).toBe(40.5);
  });
});
