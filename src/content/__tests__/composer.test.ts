import { describe, it, expect } from 'vitest';
import { ContentComposer } from '../composer';

describe('ContentComposer', () => {
  const composer = new ContentComposer();

  it('formats post caption and extracts hashtags and mentions', () => {
    const post = composer.composePost({
      baseCaption: '3 habits that doubled my output in 30 days! Check out @sam #productivity #focus',
      platforms: ['TIKTOK', 'INSTAGRAM_REELS'],
    });

    expect(post.hashtags).toEqual(['productivity', 'focus']);
    expect(post.mentions).toEqual(['sam']);
    expect(post.platformOverrides.TIKTOK?.caption).toBeDefined();
    expect(post.isValid).toBe(true);
  });

  it('enforces character limits and flags invalid posts', () => {
    const tooLongCaption = 'a'.repeat(2500);
    const post = composer.composePost({
      baseCaption: tooLongCaption,
      platforms: ['TIKTOK'],
    });

    expect(post.isValid).toBe(false);
    expect(post.validationErrors).toContain('TikTok caption exceeds maximum length of 2200 characters');
  });

  it('supports platform-specific overrides for audio and tags', () => {
    const post = composer.composePost({
      baseCaption: 'Morning workout routine #fitness',
      platforms: ['TIKTOK', 'YOUTUBE_SHORTS'],
      overrides: {
        TIKTOK: {
          caption: 'Morning workout routine (TikTok sound sync) #fitness #fyp',
          soundId: 'sound-original-123',
        },
      },
    });

    expect(post.platformOverrides.TIKTOK?.caption).toContain('TikTok sound sync');
    expect(post.platformOverrides.TIKTOK?.soundId).toBe('sound-original-123');
    expect(post.platformOverrides.YOUTUBE_SHORTS?.caption).toBe('Morning workout routine #fitness');
  });
});
