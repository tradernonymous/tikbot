export class InvalidSocialUrlError extends Error {
  constructor(message: string) {
    super(`Invalid social media URL: ${message}`);
    this.name = 'InvalidSocialUrlError';
  }
}

export type PlatformType = 'TIKTOK' | 'DOUYIN';

export interface NormalizedSocialUrl {
  platform: PlatformType;
  canonicalUrl: string;
  isShortLink: boolean;
  authorHandle?: string;
  videoId?: string;
}

const ALLOWED_HOSTS = new Set([
  'tiktok.com',
  'www.tiktok.com',
  'vm.tiktok.com',
  'vt.tiktok.com',
  'm.tiktok.com',
  'douyin.com',
  'www.douyin.com',
  'v.douyin.com',
  'iesdouyin.com',
]);

/**
 * Extracts URLs from clipboard or share messages (e.g. mobile TikTok/Douyin app share text).
 */
export function extractUrlsFromShareText(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  if (!matches) {
    return [];
  }
  return matches.map((u) => u.replace(/[，,。!！\]】)]+$/, ''));
}

/**
 * Parses and sanitizes a TikTok or Douyin URL against SSRF and formats it canonically.
 */
export function parseAndNormalizeSocialUrl(rawUrl: string): NormalizedSocialUrl {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new InvalidSocialUrlError(`Malformed URL string "${rawUrl}"`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new InvalidSocialUrlError(`Unsupported protocol "${parsed.protocol}"`);
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(hostname)) {
    throw new InvalidSocialUrlError(`Domain "${hostname}" is not an allowed TikTok or Douyin domain.`);
  }

  // 1. TikTok Short Links (vm.tiktok.com / vt.tiktok.com)
  if (hostname === 'vm.tiktok.com' || hostname === 'vt.tiktok.com') {
    const cleanPath = parsed.pathname.replace(/\/+$/, '');
    return {
      platform: 'TIKTOK',
      canonicalUrl: `https://${hostname}${cleanPath}/`,
      isShortLink: true,
    };
  }

  // 2. Douyin Short Links (v.douyin.com)
  if (hostname === 'v.douyin.com') {
    const cleanPath = parsed.pathname.replace(/\/+$/, '');
    return {
      platform: 'DOUYIN',
      canonicalUrl: `https://${hostname}${cleanPath}/`,
      isShortLink: true,
    };
  }

  // 3. TikTok Standard Web URL (/@[author]/video/[id])
  if (hostname.includes('tiktok.com')) {
    const match = parsed.pathname.match(/^\/@([^/]+)\/video\/(\d+)/);
    if (match) {
      const authorHandle = match[1];
      const videoId = match[2];
      return {
        platform: 'TIKTOK',
        canonicalUrl: `https://www.tiktok.com/@${authorHandle}/video/${videoId}`,
        isShortLink: false,
        authorHandle,
        videoId,
      };
    }

    // Default TikTok fallback
    return {
      platform: 'TIKTOK',
      canonicalUrl: `https://${hostname}${parsed.pathname}`,
      isShortLink: false,
    };
  }

  // 4. Douyin Standard Web URL (/video/[id])
  if (hostname.includes('douyin.com')) {
    const match = parsed.pathname.match(/\/video\/(\d+)/);
    if (match) {
      const videoId = match[1];
      return {
        platform: 'DOUYIN',
        canonicalUrl: `https://www.douyin.com/video/${videoId}`,
        isShortLink: false,
        videoId,
      };
    }

    return {
      platform: 'DOUYIN',
      canonicalUrl: `https://${hostname}${parsed.pathname}`,
      isShortLink: false,
    };
  }

  throw new InvalidSocialUrlError(`Unrecognized URL structure: "${rawUrl}"`);
}
