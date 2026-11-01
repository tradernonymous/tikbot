'use client';

import React from 'react';
import { useOperations } from '@/context/OperationsContext';
import { useSessionContext } from '@/context/SessionContext';
import { useNotifications } from '@/context/NotificationsContext';
import { MobileActionCenter } from './MobileActionCenter';

export function DashboardMobileActionCenterWrapper() {
  const { killSwitchActive, toggleKillSwitch } = useOperations();
  const { selectedAccountId } = useSessionContext();
  const { unreadCount } = useNotifications();

  return (
    <MobileActionCenter
      killSwitchActive={killSwitchActive}
      pendingApprovalsCount={unreadCount}
      activeAccount={selectedAccountId || 'default'}
      provenance="live"
      onToggleKillSwitch={toggleKillSwitch}
    />
  );
}
