import { ActionType, COMPLIANCE_ACTION_CAPS } from '../farm/rate-limiter';

export interface FarmCapacityPlan {
  targetDailyActions: number;
  actionType: ActionType;
  minimumAccountsRequired: number;
  actionsPerAccount: number;
  isCompliant: boolean;
}

export interface SimulationParams {
  totalActions: number;
  accountPoolSize: number;
  actionType: ActionType;
  dayHours?: number;
}

export interface SimulationResult {
  totalDispatched: number;
  droppedActions: number;
  maxDailyActionsOnSingleAccount: number;
  avgActionsPerHour: number;
  hasComplianceViolations: boolean;
}

export class FarmLoadSimulator {
  calculateFarmCapacity(params: { targetDailyActions: number; actionType: ActionType }): FarmCapacityPlan {
    const cap = COMPLIANCE_ACTION_CAPS[params.actionType];
    const maxPerDay = cap ? cap.maxPerDay : 25;

    const minimumAccountsRequired = Math.ceil(params.targetDailyActions / maxPerDay);

    return {
      targetDailyActions: params.targetDailyActions,
      actionType: params.actionType,
      minimumAccountsRequired,
      actionsPerAccount: maxPerDay,
      isCompliant: true,
    };
  }

  simulateDailyRun(params: SimulationParams): SimulationResult {
    const dayHours = params.dayHours || 16;
    const cap = COMPLIANCE_ACTION_CAPS[params.actionType] || COMPLIANCE_ACTION_CAPS.LIKE;
    const poolCapacity = params.accountPoolSize * cap.maxPerDay;

    const totalDispatched = Math.min(params.totalActions, poolCapacity);
    const droppedActions = Math.max(0, params.totalActions - poolCapacity);

    // Distribute evenly across pool
    const actionsPerAccount = Math.ceil(totalDispatched / params.accountPoolSize);

    return {
      totalDispatched,
      droppedActions,
      maxDailyActionsOnSingleAccount: actionsPerAccount,
      avgActionsPerHour: Number((totalDispatched / dayHours).toFixed(2)),
      hasComplianceViolations: droppedActions > 0 || actionsPerAccount > cap.maxPerDay,
    };
  }
}
