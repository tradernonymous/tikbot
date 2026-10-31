import { PublishRequest, PublishResult } from '../publisher';

export interface BrowserDriverOptions {
  browserSessionRunner?: (req: PublishRequest) => Promise<{
    publishedVideoId: string;
    url: string;
  }>;
}

export class BrowserDriver {
  private runner: (req: PublishRequest) => Promise<{ publishedVideoId: string; url: string }>;

  constructor(options: BrowserDriverOptions = {}) {
    this.runner =
      options.browserSessionRunner ||
      (async (req) => {
        const publishedId = `v_tt_${Date.now()}`;
        return {
          publishedVideoId: publishedId,
          url: `https://www.tiktok.com/@creator/video/${publishedId}`,
        };
      });
  }

  upload = async (req: PublishRequest): Promise<PublishResult> => {
    const res = await this.runner(req);
    return {
      success: true,
      publishedVideoId: res.publishedVideoId,
      url: res.url,
      driverType: 'BROWSER',
      providerStatus: 'PUBLISH_COMPLETE',
    };
  };
}
