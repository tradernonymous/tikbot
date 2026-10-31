import { cache } from 'react';
import { prisma } from '@/lib/prisma';

export interface DashboardAggregates {
  provenance: 'live' | 'cached' | 'unknown';
  totalAccounts: number;
  activeAccounts: number;
  bannedAccounts: number;
  banRateFormatted: string | null;
  pendingCampaigns: number;
  pendingPublish: number;
  pendingApprovals: number;
  runningTasksCount: number;
  maxOutlierScore: number;
}

export const getDashboardAggregates = cache(async (): Promise<DashboardAggregates> => {
  try {
    const [
      totalAccounts,
      activeAccounts,
      bannedAccounts,
      pendingCampaigns,
      pendingPublish,
      runningTasksCount,
      outlierAggregate,
    ] = await Promise.all([
      prisma.platformAccount.count(),
      prisma.platformAccount.count({ where: { status: 'ACTIVE' } }),
      prisma.platformAccount.count({ where: { status: 'BANNED' } }),
      prisma.campaign.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.publishJob.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.job.count({ where: { status: 'RUNNING' } }),
      prisma.researchPost.aggregate({ _max: { outlierScore: true } }),
    ]);

    const banRateFormatted =
      totalAccounts > 0
        ? `${((bannedAccounts / totalAccounts) * 100).toFixed(1)}%`
        : null;

    const maxOutlierScore = outlierAggregate?._max?.outlierScore || 0;

    return {
      provenance: 'live',
      totalAccounts,
      activeAccounts,
      bannedAccounts,
      banRateFormatted,
      pendingCampaigns,
      pendingPublish,
      pendingApprovals: pendingCampaigns + pendingPublish,
      runningTasksCount,
      maxOutlierScore,
    };
  } catch {
    return {
      provenance: 'unknown',
      totalAccounts: 0,
      activeAccounts: 0,
      bannedAccounts: 0,
      banRateFormatted: null,
      pendingCampaigns: 0,
      pendingPublish: 0,
      pendingApprovals: 0,
      runningTasksCount: 0,
      maxOutlierScore: 0,
    };
  }
});
