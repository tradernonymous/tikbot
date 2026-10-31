import { describe, it, expect } from 'vitest';
import { FarmLoadSimulator } from '../load-sim';

describe('FarmLoadSimulator', () => {
  const simulator = new FarmLoadSimulator();

  it('calculates minimum accounts required to safely deliver target daily actions', () => {
    // 1,000 likes/day: LIKE cap is 25/day per account -> minimum 40 accounts
    const requirement = simulator.calculateFarmCapacity({
      targetDailyActions: 1000,
      actionType: 'LIKE',
    });

    expect(requirement.minimumAccountsRequired).toBe(40);
    expect(requirement.actionsPerAccount).toBe(25);
    expect(requirement.isCompliant).toBe(true);
  });

  it('simulates 1,000+ actions/day distribution and confirms 0 velocity violations', () => {
    const simResult = simulator.simulateDailyRun({
      totalActions: 1200,
      accountPoolSize: 50,
      actionType: 'LIKE',
      dayHours: 16, // Active 16h/day
    });

    expect(simResult.totalDispatched).toBe(1200);
    expect(simResult.droppedActions).toBe(0);
    expect(simResult.maxDailyActionsOnSingleAccount).toBeLessThanOrEqual(25);
    expect(simResult.avgActionsPerHour).toBe(75);
    expect(simResult.hasComplianceViolations).toBe(false);
  });

  it('flags violations if account pool is too small for aggressive daily target', () => {
    const simResult = simulator.simulateDailyRun({
      totalActions: 1000,
      accountPoolSize: 10, // 10 accounts * 25 max likes = 250 max likes/day
      actionType: 'LIKE',
      dayHours: 16,
    });

    expect(simResult.hasComplianceViolations).toBe(true);
    expect(simResult.droppedActions).toBe(750); // 1000 - 250 = 750 dropped
  });
});
