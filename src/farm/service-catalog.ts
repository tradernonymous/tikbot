import { AgingTier } from './aging-tiers';

export type FarmServiceType =
  | 'watch'
  | 'like'
  | 'comment'
  | 'share'
  | 'save'
  | 'follow'
  | 'live-boost'
  | 'FYP_PUSH';

export interface FarmServiceDef {
  id: FarmServiceType;
  name: string;
  description: string;
  minTier: AgingTier;
  dailyCapPerAccount: number;
  safetyBudgetCost: number;
  sequenceSteps?: string[];
}

export const FARM_SERVICES: FarmServiceDef[] = [
  {
    id: 'watch',
    name: 'High-Retention Video Watch',
    description: 'Natural view completion and rewatch loop to signal interest to TikTok recommendation heuristics.',
    minTier: 'FRESH',
    dailyCapPerAccount: 40,
    safetyBudgetCost: 1,
  },
  {
    id: 'like',
    name: 'Targeted Humanized Like',
    description: 'Post-completion like action delayed by natural dwell time.',
    minTier: 'JUNIOR',
    dailyCapPerAccount: 25,
    safetyBudgetCost: 2,
  },
  {
    id: 'comment',
    name: 'Niche Contextual Comment',
    description: 'Unique comments drawn from vetted vocabulary with high Jaccard distance.',
    minTier: 'MATURE',
    dailyCapPerAccount: 10,
    safetyBudgetCost: 5,
  },
  {
    id: 'share',
    name: 'Internal & Copy-Link Share',
    description: 'Simulates copy-link and direct in-app message share actions.',
    minTier: 'JUNIOR',
    dailyCapPerAccount: 15,
    safetyBudgetCost: 2,
  },
  {
    id: 'save',
    name: 'Favorite & Bookmark',
    description: 'Signals high content utility by adding post to user favorites.',
    minTier: 'JUNIOR',
    dailyCapPerAccount: 20,
    safetyBudgetCost: 2,
  },
  {
    id: 'follow',
    name: 'Creator Follow Action',
    description: 'Organic creator follow following complete video view and profile exploration.',
    minTier: 'MATURE',
    dailyCapPerAccount: 8,
    safetyBudgetCost: 4,
  },
  {
    id: 'live-boost',
    name: 'Live Stream Dwell & Engagement',
    description: 'Viewer dwell in ongoing live stream with chat question routing.',
    minTier: 'MATURE',
    dailyCapPerAccount: 5,
    safetyBudgetCost: 6,
  },
  {
    id: 'FYP_PUSH',
    name: 'Full FYP Push Sequence',
    description: 'watch -> complete -> rewatch -> like -> save -> share -> natural pause.',
    minTier: 'PRIME',
    dailyCapPerAccount: 3,
    safetyBudgetCost: 12,
    sequenceSteps: ['watch', 'complete', 'rewatch', 'like', 'save', 'share', 'natural-pause'],
  },
];

const TIER_HIERARCHY: Record<AgingTier, number> = {
  FRESH: 0,
  JUNIOR: 1,
  MATURE: 2,
  PRIME: 3,
};

export function getServiceCatalog(): FarmServiceDef[] {
  return FARM_SERVICES;
}

export function getServiceById(id: FarmServiceType | string): FarmServiceDef | undefined {
  return FARM_SERVICES.find((s) => s.id === id);
}

export function validateServiceEligibility(
  serviceId: FarmServiceType | string,
  accountTier: AgingTier,
  currentDailyUsage: number,
  safetyBudgetAvailable: number
): { eligible: boolean; reason?: string } {
  const service = getServiceById(serviceId);
  if (!service) {
    return { eligible: false, reason: `Service ${serviceId} not found in catalog` };
  }

  if (TIER_HIERARCHY[accountTier] < TIER_HIERARCHY[service.minTier]) {
    return {
      eligible: false,
      reason: `Tier requirement not met: account is ${accountTier}, service requires minimum ${service.minTier}`,
    };
  }

  if (currentDailyUsage >= service.dailyCapPerAccount) {
    return {
      eligible: false,
      reason: `Daily cap reached: account has executed ${currentDailyUsage}/${service.dailyCapPerAccount} runs today`,
    };
  }

  if (safetyBudgetAvailable < service.safetyBudgetCost) {
    return {
      eligible: false,
      reason: `Safety budget exceeded: operation costs ${service.safetyBudgetCost} but account only has ${safetyBudgetAvailable} budget remaining`,
    };
  }

  return { eligible: true };
}
