export type PublishingPlatform = 'TIKTOK' | 'INSTAGRAM_REELS' | 'YOUTUBE_SHORTS';

export interface PlatformOverride {
  caption?: string;
  soundId?: string;
  tags?: string[];
}

export interface ComposeInput {
  baseCaption: string;
  platforms: PublishingPlatform[];
  mediaAssetId?: string;
  overrides?: Partial<Record<PublishingPlatform, PlatformOverride>>;
}

export interface ComposedPost {
  baseCaption: string;
  hashtags: string[];
  mentions: string[];
  platforms: PublishingPlatform[];
  platformOverrides: Record<PublishingPlatform, { caption: string; soundId?: string; tags: string[] }>;
  isValid: boolean;
  validationErrors: string[];
}

const PLATFORM_CAPTION_LIMITS: Record<PublishingPlatform, number> = {
  TIKTOK: 2200,
  INSTAGRAM_REELS: 2200,
  YOUTUBE_SHORTS: 100,
};

export class ContentComposer {
  composePost(input: ComposeInput): ComposedPost {
    const hashtags = this.extractHashtags(input.baseCaption);
    const mentions = this.extractMentions(input.baseCaption);
    const validationErrors: string[] = [];

    const platformOverrides: Record<string, { caption: string; soundId?: string; tags: string[] }> = {};

    for (const platform of input.platforms) {
      const override = input.overrides?.[platform];
      const caption = override?.caption || input.baseCaption;
      const soundId = override?.soundId;
      const tags = override?.tags || hashtags;

      const limit = PLATFORM_CAPTION_LIMITS[platform];
      if (caption.length > limit) {
        const platformName = platform === 'TIKTOK' ? 'TikTok' : platform === 'INSTAGRAM_REELS' ? 'Instagram' : 'YouTube Shorts';
        validationErrors.push(`${platformName} caption exceeds maximum length of ${limit} characters`);
      }

      platformOverrides[platform] = {
        caption,
        soundId,
        tags,
      };
    }

    return {
      baseCaption: input.baseCaption,
      hashtags,
      mentions,
      platforms: input.platforms,
      platformOverrides: platformOverrides as any,
      isValid: validationErrors.length === 0,
      validationErrors,
    };
  }

  private extractHashtags(text: string): string[] {
    const matches = text.match(/#(\w+)/g);
    if (!matches) return [];
    return matches.map((m) => m.slice(1));
  }

  private extractMentions(text: string): string[] {
    const matches = text.match(/@(\w+)/g);
    if (!matches) return [];
    return matches.map((m) => m.slice(1));
  }
}
