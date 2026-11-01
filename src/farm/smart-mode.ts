export type AccountStatus = 'ACTIVE' | 'PAUSED' | 'RESTRICTED' | 'BANNED';

export interface AccountState {
  id: string;
  username: string;
  status: AccountStatus;
  hourlyCapacity: number;
  actionsExecutedThisHour: number;
}

export interface QueuedTask {
  id: string;
  assignedAccountId: string;
  actionType: string;
  targetUrl: string;
}

export interface AnomalyEvent {
  accountId: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  occurredAt: string;
  details: string;
}

export interface TaskReassignment {
  taskId: string;
  previousAccountId: string;
  newAccountId: string;
}

export interface AnomalyNotification {
  type: string;
  title: string;
  body: string;
  provenance: 'live' | 'cached' | 'unknown';
  occurredAt: string;
}

export interface AnomalyHandlingResult {
  pausedAccountId?: string;
  accountStatusUpdatedTo?: AccountStatus;
  reassignedTasks: TaskReassignment[];
  unassignedTaskIds: string[];
  notification?: AnomalyNotification;
}

export class SmartModeOrchestrator {
  handleAnomaly(
    anomaly: AnomalyEvent,
    accounts: AccountState[],
    queuedTasks: QueuedTask[]
  ): AnomalyHandlingResult {
    // Only act on HIGH or CRITICAL anomalies
    if (anomaly.severity !== 'HIGH' && anomaly.severity !== 'CRITICAL') {
      return {
        reassignedTasks: [],
        unassignedTaskIds: [],
      };
    }

    const targetAccount = accounts.find((a) => a.id === anomaly.accountId);
    const username = targetAccount?.username || anomaly.accountId;

    // Filter available healthy accounts with remaining capacity
    const eligibleAccounts = accounts.filter(
      (a) =>
        a.id !== anomaly.accountId &&
        a.status === 'ACTIVE' &&
        a.hourlyCapacity > a.actionsExecutedThisHour
    );

    const pendingTasks = queuedTasks.filter(
      (t) => t.assignedAccountId === anomaly.accountId
    );

    const reassignedTasks: TaskReassignment[] = [];
    const unassignedTaskIds: string[] = [];

    if (eligibleAccounts.length === 0) {
      unassignedTaskIds.push(...pendingTasks.map((t) => t.id));
    } else {
      let candidateIndex = 0;
      for (const task of pendingTasks) {
        const candidate = eligibleAccounts[candidateIndex % eligibleAccounts.length];
        candidateIndex++;
        candidate.actionsExecutedThisHour += 1;

        reassignedTasks.push({
          taskId: task.id,
          previousAccountId: anomaly.accountId,
          newAccountId: candidate.id,
        });
      }
    }

    const notification: AnomalyNotification = {
      type: 'ANOMALY_PAUSE',
      title: `Account @${username} Auto-Paused`,
      body: `Anomaly [${anomaly.type}] detected: ${anomaly.details}. ${reassignedTasks.length} queued task(s) redistributed.`,
      provenance: 'live',
      occurredAt: anomaly.occurredAt,
    };

    return {
      pausedAccountId: anomaly.accountId,
      accountStatusUpdatedTo: 'PAUSED',
      reassignedTasks,
      unassignedTaskIds,
      notification,
    };
  }
}
