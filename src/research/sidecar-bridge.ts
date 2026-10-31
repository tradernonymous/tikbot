export interface SidecarVideoItem {
  id: string;
  desc: string;
  createTime: number;
  playCount: number;
  diggCount: number;
  commentCount: number;
  shareCount: number;
  author: string;
}

export interface CreatorFeedResponse {
  status: string;
  username: string;
  items: SidecarVideoItem[];
}

export interface TranscribeResponse {
  status: string;
  transcript: string;
  durationSeconds: number;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export interface PythonSidecarBridgeOptions {
  baseUrl?: string;
  internalSecret?: string;
  fetcher?: typeof fetch;
}

export class PythonSidecarBridge {
  private baseUrl: string;
  private internalSecret: string;
  private fetcher: typeof fetch;

  constructor(options: PythonSidecarBridgeOptions = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:8000';
    this.internalSecret = options.internalSecret || 'tikbot-internal-secret-change-in-prod';
    this.fetcher = options.fetcher || fetch;
  }

  async extractCreatorFeed(username: string, count = 20): Promise<CreatorFeedResponse> {
    const response = await this.fetcher(`${this.baseUrl}/api/v1/extract-feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': this.internalSecret,
      },
      body: JSON.stringify({ username, count }),
    });

    if (!response.ok) {
      throw new Error(`Python Sidecar extract-feed failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as CreatorFeedResponse;
  }

  async transcribeMedia(mediaUrl: string, language = 'en'): Promise<TranscribeResponse> {
    const response = await this.fetcher(`${this.baseUrl}/api/v1/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': this.internalSecret,
      },
      body: JSON.stringify({ mediaUrl, language }),
    });

    if (!response.ok) {
      throw new Error(`Python Sidecar transcribe failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as TranscribeResponse;
  }
}
