import { describe, it, expect } from 'vitest';
import {
  generateAutoContentPlan,
  approveContentPlanItem,
  AutoPlanInput,
} from '../auto-plan';

describe('A3.3 Auto Content Plan Generator', () => {
  it('combines TrendSignals and VOC themes into scored draft ContentPlans with calendar slots', async () => {
    const input: AutoPlanInput = {
      accountId: 'acc-growth-01',
      trendSignals: [
        { topic: 'Morning Routine for High Output', risingScore: 94 },
        { topic: 'Zero Budget Side Hustle', risingScore: 88 },
      ],
      vocThemes: [
        { theme: 'How do you balance time with a 9-5?', frequency: 45 },
      ],
      targetDaysAhead: 3,
    };

    const draftPlans = await generateAutoContentPlan(input);

    expect(draftPlans.length).toBeGreaterThanOrEqual(3);
    draftPlans.forEach((item) => {
      expect(item.status).toBe('DRAFT');
      expect(item.fitScore).toBeGreaterThanOrEqual(70);
      expect(item.fitScore).toBeLessThanOrEqual(100);
      expect(item.accountId).toBe('acc-growth-01');
      expect(item.suggestedHook).toBeTruthy();
      expect(new Date(item.suggestedSlot).getTime()).toBeGreaterThan(Date.now());
    });
  });

  it('approves a draft plan item transitioning status to APPROVED', () => {
    const item = {
      id: 'plan-1',
      title: 'High Output Morning Routine',
      topic: 'Morning Routine',
      source: 'TREND_SIGNAL' as const,
      fitScore: 92,
      status: 'DRAFT' as const,
      suggestedHook: 'Stop waking up tired.',
      suggestedSlot: new Date(Date.now() + 86400000).toISOString(),
      accountId: 'acc-1',
    };

    const approved = approveContentPlanItem(item);
    expect(approved.status).toBe('APPROVED');
    expect(approved.id).toBe('plan-1');
  });
});
