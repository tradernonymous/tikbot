import { describe, it, expect } from 'vitest';
import {
  WarmupEngine,
  type WarmupDayPlan,
} from '../warmup-routine';

describe('Account Farm Warmup Routine Engine', () => {
  it('generates multi-day progression plan starting at Day 1', () => {
    const engine = new WarmupEngine('acc-warm-1');
    const day1Plan = engine.getCurrentDayPlan();

    expect(day1Plan.day).toBe(1);
    expect(day1Plan.targetViews).toBe(10);
    expect(day1Plan.targetLikes).toBe(0);
    expect(day1Plan.profileSetupRequired).toBe(true);
    expect(day1Plan.graduated).toBe(false);
  });

  it('advances days sequentially as targets are met and graduates on Day 7', () => {
    const engine = new WarmupEngine('acc-warm-2');

    // Simulate progressing through days 1 to 6
    for (let d = 1; d <= 6; d++) {
      expect(engine.getCurrentDay()).toBe(d);
      engine.completeCurrentDay();
    }

    expect(engine.getCurrentDay()).toBe(7);
    const day7Plan = engine.getCurrentDayPlan();
    expect(day7Plan.graduated).toBe(true);
  });
});
