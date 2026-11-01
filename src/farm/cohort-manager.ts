import { AgingTier } from './aging-tiers';

export interface FarmCohort {
  id: string;
  name: string;
  niche: string;
  minTier: AgingTier;
  accountIds: string[];
  createdAt: string;
  updatedAt: string;
}

const cohortsStore = new Map<string, FarmCohort>();

export function createCohort(input: {
  name: string;
  niche: string;
  minTier: AgingTier;
  accountIds: string[];
}): FarmCohort {
  const id = `cohort-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const cohort: FarmCohort = {
    id,
    name: input.name,
    niche: input.niche,
    minTier: input.minTier,
    accountIds: [...input.accountIds],
    createdAt: now,
    updatedAt: now,
  };
  cohortsStore.set(id, cohort);
  return cohort;
}

export function getCohorts(): FarmCohort[] {
  if (cohortsStore.size === 0) {
    // Seed default baseline cohorts if store is empty
    createCohort({
      name: 'Crypto-Fresh',
      niche: 'crypto',
      minTier: 'FRESH',
      accountIds: ['farm-acc-1', 'farm-acc-2'],
    });
    createCohort({
      name: 'Beauty-Prime-US',
      niche: 'beauty',
      minTier: 'PRIME',
      accountIds: ['farm-acc-3', 'farm-acc-4'],
    });
    createCohort({
      name: 'Tech-Mature-Global',
      niche: 'technology',
      minTier: 'MATURE',
      accountIds: ['farm-acc-5'],
    });
  }
  return Array.from(cohortsStore.values());
}

export function getCohortById(id: string): FarmCohort | undefined {
  return cohortsStore.get(id);
}

export function replenishCohortAccount(
  cohortId: string,
  quarantinedAccountId: string,
  candidatePool: Array<{ id: string; niche: string; tier: string; status: string }>
): FarmCohort {
  const cohort = cohortsStore.get(cohortId);
  if (!cohort) {
    throw new Error(`Cohort ${cohortId} not found`);
  }

  // Find suitable replacement from candidate pool
  const candidate = candidatePool.find(
    (c) =>
      c.status === 'ACTIVE' &&
      c.niche === cohort.niche &&
      !cohort.accountIds.includes(c.id) &&
      c.id !== quarantinedAccountId
  );

  const newAccountIds = cohort.accountIds.filter((id) => id !== quarantinedAccountId);
  if (candidate) {
    newAccountIds.push(candidate.id);
  }

  const updated: FarmCohort = {
    ...cohort,
    accountIds: newAccountIds,
    updatedAt: new Date().toISOString(),
  };
  cohortsStore.set(cohortId, updated);
  return updated;
}

export function filterHealthyCohortAccounts(
  accountIds: string[],
  healthScores: Map<string, number>,
  minHealthThreshold = 50
): string[] {
  return accountIds.filter((id) => {
    const score = healthScores.get(id);
    return score !== undefined ? score >= minHealthThreshold : true;
  });
}

export function clearCohorts(): void {
  cohortsStore.clear();
}
