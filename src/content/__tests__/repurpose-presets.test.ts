import { describe, it, expect } from 'vitest';
import {
  PLATFORM_PRESETS,
  validatePlatformMedia,
  buildFFmpegPresetArgs,
} from '../repurpose-presets';

describe('M6.4 Repurpose Multi-Platform Presets', () => {
  it('defines valid platform presets with safe zones and duration caps', () => {
    expect(PLATFORM_PRESETS.TIKTOK.maxDurationSeconds).toBe(600);
    expect(PLATFORM_PRESETS.YOUTUBE_SHORTS.maxDurationSeconds).toBe(60);
    expect(PLATFORM_PRESETS.INSTAGRAM_REELS.maxDurationSeconds).toBe(90);

    expect(PLATFORM_PRESETS.YOUTUBE_SHORTS.aspectRatio).toBe('9:16');
    expect(PLATFORM_PRESETS.INSTAGRAM_REELS.safeZone.bottom).toBeGreaterThan(0);
  });

  it('validates video adhering to YouTube Shorts constraints', () => {
    const valid = validatePlatformMedia('YOUTUBE_SHORTS', {
      durationSeconds: 45,
      width: 1080,
      height: 1920,
    });
    expect(valid.valid).toBe(true);
  });

  it('rejects video exceeding YouTube Shorts 60s duration limit', () => {
    const invalid = validatePlatformMedia('YOUTUBE_SHORTS', {
      durationSeconds: 75,
      width: 1080,
      height: 1920,
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors).toContain('Duration 75s exceeds maximum allowed (60s)');
  });

  it('rejects video exceeding Instagram Reels 90s duration limit', () => {
    const invalid = validatePlatformMedia('INSTAGRAM_REELS', {
      durationSeconds: 120,
      width: 1080,
      height: 1920,
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors).toContain('Duration 120s exceeds maximum allowed (90s)');
  });

  it('builds FFmpeg command filter arguments for vertical 9:16 output', () => {
    const args = buildFFmpegPresetArgs('YOUTUBE_SHORTS', '/tmp/input.mp4', '/tmp/out.mp4');
    expect(args).toContain('-vf');
    expect(args.some((a) => a.includes('scale=1080:1920'))).toBe(true);
    expect(args).toContain('-c:v');
    expect(args).toContain('libx264');
  });
});
