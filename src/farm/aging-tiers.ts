export type AgingTier = 'FRESH' | 'JUNIOR' | 'MATURE' | 'PRIME';

export type FarmServiceType =
  | 'VIEW'
  | 'LIKE'
  | 'FOLLOW'
  | 'COMMENT'
  | 'SHARE'
  | 'SAVE'
  | 'FYP_PUSH'
  | 'LIVE_BOOST';

export function getAgingTier(ageDays: number): AgingTier {
  if (ageDays < 3) return 'FRESH';
  if (ageDays < 14) return 'JUNIOR';
  if (ageDays < 45) return 'MATURE';
  return 'PRIME';
}

const TIER_PERMISSIONS: Record<AgingTier, Set<FarmServiceType>> = {
  FRESH: new Set(['VIEW']),
  JUNIOR: new Set(['VIEW', 'LIKE', 'FOLLOW']),
  MATURE: new Set(['VIEW', 'LIKE', 'FOLLOW', 'COMMENT', 'SHARE', 'SAVE']),
  PRIME: new Set([
    'VIEW',
    'LIKE',
    'FOLLOW',
    'COMMENT',
    'SHARE',
    'SAVE',
    'FYP_PUSH',
    'LIVE_BOOST',
  ]),
};

export function isServiceAllowedForTier(tier: AgingTier, service: FarmServiceType): boolean {
  return TIER_PERMISSIONS[tier]?.has(service) ?? false;
}
