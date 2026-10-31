import { parseAndNormalizeSocialUrl } from './url-parser';

export interface VideoExtractionResponse {
  status: 'success' | 'failed';
  message?: string;
  data?: {
    platform?: string;
    id?: string;
    desc?: string;
    video?: {
      play_addr?: { url_list?: string[] };
      cover?: { url_list?: string[] };
    };
    author?: {
      id?: string;
      unique_id?: string;
      nickname?: string;
    };
    statistics?: {
      play_count?: number;
      digg_count?: number;
      comment_count?: number;
      share_count?: number;
    };
  };
}

export interface ExtractedMediaData {
  platform: 'TIKTOK' | 'DOUYIN';
  postId: string;
  caption: string;
  playUrl: string;
  coverUrl: string;
  author: {
    id: string;
    handle: string;
    nickname: string;
  };
  stats: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
}

export interface DouyinTikTokClientOptions {
  apiBaseUrl?: string;
  fetcher?: typeof fetch;
}

export class DouyinTikTokClient {
  private apiBaseUrl: string;
  private fetcher: typeof fetch;

  constructor(options: DouyinTikTokClientOptions = {}) {
    this.apiBaseUrl = options.apiBaseUrl || 'http://localhost:8000';
    this.fetcher = options.fetcher || fetch;
  }

  async extractVideoData(rawUrl: string): Promise<ExtractedMediaData> {
    const normalized = parseAndNormalizeSocialUrl(rawUrl);
    const endpoint = `${this.apiBaseUrl}/api/hybrid/video_data?url=${encodeURIComponent(
      normalized.canonicalUrl
    )}`;

    const response = await this.fetcher(endpoint, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch video data from Download API: ${response.status} ${response.statusText}`
      );
    }

    const payload = (await response.json()) as VideoExtractionResponse;
    if (payload.status !== 'success' || !payload.data) {
      throw new Error(`Download API returned error: ${payload.message || 'Unknown error'}`);
    }

    const d = payload.data;
    const playUrl = d.video?.play_addr?.url_list?.[0] || '';
    const coverUrl = d.video?.cover?.url_list?.[0] || '';

    return {
      platform: normalized.platform,
      postId: d.id || normalized.videoId || '',
      caption: d.desc || '',
      playUrl,
      coverUrl,
      author: {
        id: d.author?.id || '',
        handle: d.author?.unique_id || normalized.authorHandle || '',
        nickname: d.author?.nickname || '',
      },
      stats: {
        views: d.statistics?.play_count || 0,
        likes: d.statistics?.digg_count || 0,
        comments: d.statistics?.comment_count || 0,
        shares: d.statistics?.share_count || 0,
      },
    };
  }
}
