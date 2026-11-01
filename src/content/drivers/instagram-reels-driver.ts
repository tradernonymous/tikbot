import type { PublishRequest, PublishResult } from '../publisher';

export interface InstagramReelsDriverOptions {
  accessToken: string;
  instagramAccountId: string;
  apiBaseUrl?: string;
  fetchClient?: typeof fetch;
}

export class InstagramReelsDriver {
  private accessToken: string;
  private instagramAccountId: string;
  private apiBaseUrl: string;
  private fetch: typeof fetch;

  constructor(options: InstagramReelsDriverOptions) {
    this.accessToken = options.accessToken;
    this.instagramAccountId = options.instagramAccountId;
    this.apiBaseUrl = options.apiBaseUrl || 'https://graph.facebook.com/v19.0';
    this.fetch = options.fetchClient || globalThis.fetch.bind(globalThis);
  }

  upload = async (req: PublishRequest): Promise<PublishResult> => {
    // 1. Create Media Container
    const containerParams = new URLSearchParams({
      media_type: 'REELS',
      video_url: req.mediaPath,
      caption: req.caption,
      share_to_feed: 'true',
      access_token: this.accessToken,
    });

    const containerRes = await this.fetch(
      `${this.apiBaseUrl}/${this.instagramAccountId}/media?${containerParams.toString()}`,
      {
        method: 'POST',
      }
    );

    if (!containerRes.ok) {
      const errText = await containerRes.text().catch(() => '');
      throw new Error(
        `Instagram Graph API error during container creation: ${containerRes.status} ${containerRes.statusText} ${errText}`
      );
    }

    const containerData = await containerRes.json();
    const creationId = containerData.id;

    if (!creationId) {
      throw new Error('Instagram Graph API did not return container creation ID');
    }

    // 2. Publish Container
    const publishParams = new URLSearchParams({
      creation_id: creationId,
      access_token: this.accessToken,
    });

    const publishRes = await this.fetch(
      `${this.apiBaseUrl}/${this.instagramAccountId}/media_publish?${publishParams.toString()}`,
      {
        method: 'POST',
      }
    );

    if (!publishRes.ok) {
      const errText = await publishRes.text().catch(() => '');
      throw new Error(
        `Instagram Graph API error during media publish: ${publishRes.status} ${publishRes.statusText} ${errText}`
      );
    }

    const publishData = await publishRes.json();
    const mediaId = publishData.id || creationId;

    return {
      success: true,
      publishedVideoId: mediaId,
      url: `https://www.instagram.com/reel/${mediaId}`,
      privacyLevel: 'PUBLIC_TO_EVERYONE',
      driverType: 'OFFICIAL',
      details: {
        platform: 'INSTAGRAM_REELS',
        instagramMediaId: mediaId,
      },
    };
  };
}
