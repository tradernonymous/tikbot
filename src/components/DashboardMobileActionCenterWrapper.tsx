'use client';

import React from 'react';
import { useOperations } from '@/context/OperationsContext';
import { useSessionContext } from '@/context/SessionContext';
import { useNotifications } from '@/context/NotificationsContext';
import { MobileActionCenter } from './MobileActionCenter';

export function DashboardMobileActionCenterWrapper() {
  const {
    killSwitchActive,
    toggleKillSwitch,
    campaigns,
    approveCampaign,
    publishJobs,
    approvePublishJob,
  } = useOperations();
  const { selectedAccountId } = useSessionContext();
  const { unreadCount, counts } = useNotifications();

  const handleQuickApprove = () => {
    const pendingCampaign = campaigns.find((c) => c.status === 'PENDING_APPROVAL');
    if (pendingCampaign) {
      approveCampaign(pendingCampaign.id);
      return;
    }
    const pendingJob = publishJobs.find((j) => j.status === 'PENDING_APPROVAL');
    if (pendingJob) {
      approvePublishJob(pendingJob.id);
    }
  };

  const pendingCount = counts.approvals > 0 ? counts.approvals : unreadCount;

  return (
    <MobileActionCenter
      killSwitchActive={killSwitchActive}
      pendingApprovalsCount={pendingCount}
      activeAccount={selectedAccountId || 'default'}
      provenance="live"
      onToggleKillSwitch={toggleKillSwitch}
      onQuickApprove={handleQuickApprove}
    />
  );
}
