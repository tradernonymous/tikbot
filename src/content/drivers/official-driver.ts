import { PublishRequest, PublishResult } from '../publisher';

export interface OfficialDriverOptions {
  accessToken: string;
  apiBaseUrl?: string;
  fetchClient?: typeof fetch;
}

export class OfficialDriver {
  private accessToken: string;
  private apiBaseUrl: string;
  private fetch: typeof fetch;

  constructor(options: OfficialDriverOptions) {
    this.accessToken = options.accessToken;
    this.apiBaseUrl = options.apiBaseUrl || 'https://open.tiktokapis.com';
    this.fetch = options.fetchClient || globalThis.fetch.bind(globalThis);
  }

  upload = async (req: PublishRequest): Promise<PublishResult> => {
    // 1. Creator Info Query
    const creatorRes = await this.fetch(`${this.apiBaseUrl}/v2/post/publish/creator_info/query/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!creatorRes.ok) {
      throw new Error(`TikTok API error during creator_info query: ${creatorRes.status} ${creatorRes.statusText}`);
    }

    const creatorData = await creatorRes.json();
    const privacyOptions: string[] = creatorData?.data?.privacy_level_options || ['SELF_ONLY'];
    const privacyLevel: 'SELF_ONLY' | 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR' =
      privacyOptions.includes('PUBLIC_TO_EVERYONE') ? 'PUBLIC_TO_EVERYONE' : 'SELF_ONLY';

    // 2. Video Publish Init
    const initRes = await this.fetch(`${this.apiBaseUrl}/v2/post/publish/video/init/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: req.caption,
          privacy_level: privacyLevel,
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: req.mediaPath,
        },
      }),
    });

    if (!initRes.ok) {
      throw new Error(`TikTok API error during video init: ${initRes.status} ${initRes.statusText}`);
    }

    const initData = await initRes.json();
    const publishId = initData?.data?.publish_id || `pub_${Date.now()}`;

    // 3. Status Fetch Poll
    const statusRes = await this.fetch(`${this.apiBaseUrl}/v2/post/publish/status/fetch/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        publish_id: publishId,
      }),
    });

    if (!statusRes.ok) {
      throw new Error(`TikTok API error during status fetch: ${statusRes.status} ${statusRes.statusText}`);
    }

    const statusData = await statusRes.json();
    const publishedId = statusData?.data?.publicaly_available_post_id?.[0] || publishId;
    const providerStatus = statusData?.data?.status || 'PUBLISH_COMPLETE';

    return {
      success: true,
      publishId,
      publishedVideoId: publishedId,
      privacyLevel,
      providerStatus,
      driverType: 'OFFICIAL',
      url: `https://www.tiktok.com/@creator/video/${publishedId}`,
      details: statusData?.data,
    };
  };
}
