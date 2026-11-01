import type { PublishRequest, PublishResult } from '../publisher';

export interface YouTubeShortsDriverOptions {
  accessToken: string;
  apiBaseUrl?: string;
  fetchClient?: typeof fetch;
}

export class YouTubeShortsDriver {
  private accessToken: string;
  private apiBaseUrl: string;
  private fetch: typeof fetch;

  constructor(options: YouTubeShortsDriverOptions) {
    this.accessToken = options.accessToken;
    this.apiBaseUrl = options.apiBaseUrl || 'https://www.googleapis.com';
    this.fetch = options.fetchClient || globalThis.fetch.bind(globalThis);
  }

  upload = async (req: PublishRequest): Promise<PublishResult> => {
    let caption = req.caption.trim();
    if (!caption.toLowerCase().includes('#shorts')) {
      caption = `${caption} #Shorts`;
    }

    const title = caption.slice(0, 100);

    const metadata = {
      snippet: {
        title,
        description: caption,
        tags: ['Shorts', 'VerticalVideo'],
        categoryId: '22',
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false,
      },
    };

    // 1. Initiate Resumable Upload
    const initRes = await this.fetch(
      `${this.apiBaseUrl}/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': 'video/mp4',
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!initRes.ok) {
      const errText = await initRes.text().catch(() => '');
      throw new Error(`YouTube Shorts API error: ${initRes.status} ${initRes.statusText} ${errText}`);
    }

    const uploadUrl = initRes.headers.get('location');
    if (!uploadUrl) {
      throw new Error('YouTube Shorts API did not return resumable upload location header');
    }

    // 2. Upload video payload
    const uploadRes = await this.fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
      },
      body: req.mediaPath,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => '');
      throw new Error(`YouTube Shorts API error during media upload: ${uploadRes.status} ${uploadRes.statusText} ${errText}`);
    }

    const data = await uploadRes.json();
    const videoId = data.id || 'unknown';

    return {
      success: true,
      publishedVideoId: videoId,
      url: `https://youtube.com/shorts/${videoId}`,
      privacyLevel: 'PUBLIC_TO_EVERYONE',
      driverType: 'OFFICIAL',
      details: {
        platform: 'YOUTUBE_SHORTS',
        youtubeVideoId: videoId,
      },
    };
  };
}
