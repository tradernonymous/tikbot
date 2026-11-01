import { createHash } from 'node:crypto';

export type PathCategory =
  | 'SEARCH_CREATOR_PROFILE'
  | 'SEARCH_HASHTAG_SOUND'
  | 'DIRECT_WATCH';

export interface DiscoveryPathType {
  type: PathCategory;
  entryUrl: string;
  steps: string[];
}

export function generateDiscoveryPath(
  accountId: string,
  targetHandle: string,
  tagOrSound: string
): DiscoveryPathType {
  const hash = createHash('sha256').update(accountId).digest();
  const seed = hash[0] % 100;

  const cleanHandle = targetHandle.replace('@', '');
  const cleanTag = tagOrSound.replace('#', '');

  // Split: 50% search creator profile, 35% search hashtag, 15% direct watch
  if (seed < 50) {
    return {
      type: 'SEARCH_CREATOR_PROFILE',
      entryUrl: `https://www.tiktok.com/search/user?q=${encodeURIComponent(cleanHandle)}`,
      steps: [
        `Navigate to user search for "${cleanHandle}"`,
        `Click profile @${cleanHandle}`,
        'Locate target post in grid and click',
      ],
    };
  }

  if (seed < 85) {
    return {
      type: 'SEARCH_HASHTAG_SOUND',
      entryUrl: `https://www.tiktok.com/tag/${encodeURIComponent(cleanTag)}`,
      steps: [
        `Navigate to hashtag #${cleanTag}`,
        'Scroll feed and select target video',
      ],
    };
  }

  return {
    type: 'DIRECT_WATCH',
    entryUrl: `https://www.tiktok.com/@${cleanHandle}`,
    steps: ['Direct landing on video view url'],
  };
}
