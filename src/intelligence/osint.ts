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

export async function defaultPlatformProbeFetcher(
  url: string,
  timeoutMs = 5000,
  fetchFn: typeof fetch = fetch
): Promise<{ exists: boolean; status: number; title?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetchFn(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    clearTimeout(timeout);

    if (res.status === 200) {
      const text = await res.text().catch(() => '');
      const lower = text.toLowerCase();
      const notFound =
        lower.includes('page not found') ||
        lower.includes("account doesn't exist") ||
        lower.includes('user not found') ||
        lower.includes("couldn't find this account");

      const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : undefined;

      return {
        exists: !notFound,
        status: notFound ? 404 : 200,
        title: !notFound ? title : undefined,
      };
    }

    return { exists: false, status: res.status };
  } catch {
    return { exists: false, status: 0 };
  }
}

export async function discoverCrossPlatformHandles(
  username: string,
  options: {
    platforms?: SocialPlatform[];
    fetcher?: PlatformProbeFetcher;
  } = {}
): Promise<OsintProbeResult[]> {
  const cleanHandle = username.replace(/^@/, '').trim();
  const platforms = options.platforms || ['TIKTOK', 'INSTAGRAM', 'X', 'YOUTUBE'];
  const fetcher = options.fetcher || defaultPlatformProbeFetcher;

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
        title: 'title' in probe ? probe.title : undefined,
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
