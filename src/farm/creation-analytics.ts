export interface AccountCohortRecord {
  id: string;
  ageDays: number;
  status: string;
}

export interface CreationAnalyticsSummary {
  totalAccounts: number;
  activeAccounts: number;
  survivalRate7d: number;
  survivalRate14d: number;
  survivalRate30d: number;
  provenance: 'live' | 'cached' | 'stale';
}

export function calculateCreationAnalytics(
  cohorts: AccountCohortRecord[]
): CreationAnalyticsSummary {
  const total = cohorts.length;
  if (total === 0) {
    return {
      totalAccounts: 0,
      activeAccounts: 0,
      survivalRate7d: 0,
      survivalRate14d: 0,
      survivalRate30d: 0,
      provenance: 'live',
    };
  }

  const active = cohorts.filter((c) => c.status === 'ACTIVE').length;

  const cohorts7d = cohorts.filter((c) => c.ageDays >= 7);
  const survived7d = cohorts7d.filter((c) => c.status === 'ACTIVE').length;
  const survivalRate7d = cohorts7d.length > 0 ? (survived7d / cohorts7d.length) * 100 : 100;

  const cohorts14d = cohorts.filter((c) => c.ageDays >= 14);
  const survived14d = cohorts14d.filter((c) => c.status === 'ACTIVE').length;
  const survivalRate14d = cohorts14d.length > 0 ? (survived14d / cohorts14d.length) * 100 : 100;

  const cohorts30d = cohorts.filter((c) => c.ageDays >= 30);
  const survived30d = cohorts30d.filter((c) => c.status === 'ACTIVE').length;
  const survivalRate30d = cohorts30d.length > 0 ? (survived30d / cohorts30d.length) * 100 : 100;

  return {
    totalAccounts: total,
    activeAccounts: active,
    survivalRate7d: Math.round(survivalRate7d),
    survivalRate14d: Math.round(survivalRate14d),
    survivalRate30d: Math.round(survivalRate30d),
    provenance: 'live',
  };
}
