export interface ScraperOptions {
  number?: number;
  proxy?: string;
  sessionList?: string[];
  timeoutMs?: number;
}

export interface RawScraperPost {
  id: string;
  text?: string;
  createTime?: number;
  authorMeta?: {
    name?: string;
    nickName?: string;
  };
  playCount?: number;
  diggCount?: number;
  commentCount?: number;
  shareCount?: number;
  videoUrl?: string;
}

export interface NormalizedScrapedPost {
  id: string;
  caption: string;
  authorHandle: string;
  authorNickname?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  videoUrl?: string;
  createdAt?: Date;
}

export type ScraperFeedFetcher = (
  type: 'user' | 'hashtag',
  query: string,
  options: ScraperOptions
) => Promise<RawScraperPost[]>;

export class TiktokScraperBridge {
  private fetcher: ScraperFeedFetcher;

  constructor(options: { fetcher?: ScraperFeedFetcher } = {}) {
    this.fetcher =
      options.fetcher ||
      (async (_type, _query, _opts) => {
        // Fallback default implementation
        return [];
      });
  }

  async scrapeUserPosts(
    username: string,
    options: ScraperOptions = {}
  ): Promise<NormalizedScrapedPost[]> {
    const raw = await this.fetcher('user', username, options);
    return this.normalizePosts(raw);
  }

  async scrapeHashtag(
    tag: string,
    options: ScraperOptions = {}
  ): Promise<NormalizedScrapedPost[]> {
    const raw = await this.fetcher('hashtag', tag, options);
    return this.normalizePosts(raw);
  }

  private normalizePosts(rawList: RawScraperPost[]): NormalizedScrapedPost[] {
    return rawList.map((item) => ({
      id: item.id,
      caption: item.text || '',
      authorHandle: item.authorMeta?.name || 'unknown',
      authorNickname: item.authorMeta?.nickName,
      viewCount: item.playCount || 0,
      likeCount: item.diggCount || 0,
      commentCount: item.commentCount || 0,
      shareCount: item.shareCount || 0,
      videoUrl: item.videoUrl,
      createdAt: item.createTime ? new Date(item.createTime * 1000) : undefined,
    }));
  }
}
