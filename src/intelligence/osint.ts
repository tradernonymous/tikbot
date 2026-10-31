export type SocialPlatform = 'TIKTOK' | 'INSTAGRAM' | 'X' | 'YOUTUBE';

export interface OsintProbeResult {
  platform: SocialPlatform;
  url: string;
  found: boolean;
  confidence: number; // 0 - 100
  title?: string;
}

export type PlatformProbeFetcher = (
  url: string
) => Promise<{ exists: boolean; status: number; title?: string }>;

const PLATFORM_URL_TEMPLATES: Record<SocialPlatform, (handle: string) => string> = {
  TIKTOK: (h) => `https://www.tiktok.com/@${h}`,
  INSTAGRAM: (h) => `https://www.instagram.com/${h}/`,
  X: (h) => `https://x.com/${h}`,
  YOUTUBE: (h) => `https://www.youtube.com/@${h}`,
};

export async function discoverCrossPlatformHandles(
  username: string,
  options: {
    platforms?: SocialPlatform[];
    fetcher?: PlatformProbeFetcher;
  } = {}
): Promise<OsintProbeResult[]> {
  const cleanHandle = username.replace(/^@/, '').trim();
  const platforms = options.platforms || ['TIKTOK', 'INSTAGRAM', 'X', 'YOUTUBE'];
  const fetcher = options.fetcher || (async () => ({ exists: false, status: 404 }));

  const promises = platforms.map(async (platform) => {
    const template = PLATFORM_URL_TEMPLATES[platform];
    const url = template(cleanHandle);

    try {
      const probe = await fetcher(url);
      return {
        platform,
        url,
        found: probe.exists,
        confidence: probe.exists ? 95 : 0,
        title: probe.title,
      };
    } catch {
      return {
        platform,
        url,
        found: false,
        confidence: 0,
      };
    }
  });

  return Promise.all(promises);
}
