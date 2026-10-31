import { describe, it, expect } from 'vitest';
import {
  AccountLifecycleManager,
  InvalidStateTransitionError,
  type AccountState,
} from '../account-lifecycle';

describe('Account Lifecycle State Machine', () => {
  it('manages standard warmup to active progression', () => {
    const manager = new AccountLifecycleManager('acc-1', 'CREATED');
    expect(manager.getState()).toBe('CREATED');

    manager.transitionTo('WARMING', 'Starting Day 1 warmup routine');
    expect(manager.getState()).toBe('WARMING');

    manager.transitionTo('ACTIVE', 'Warmup routines completed successfully');
    expect(manager.getState()).toBe('ACTIVE');
  });

  it('transitions to COOLDOWN when daily limit is reached and recovers to ACTIVE', () => {
    const manager = new AccountLifecycleManager('acc-2', 'ACTIVE');

    manager.transitionTo('COOLDOWN', 'Reached 80% of daily action cap');
    expect(manager.getState()).toBe('COOLDOWN');

    manager.transitionTo('ACTIVE', 'Midnight UTC reset');
    expect(manager.getState()).toBe('ACTIVE');
  });

  it('quarantines account into BANNED status and prevents further active transitions', () => {
    const manager = new AccountLifecycleManager('acc-3', 'ACTIVE');

    manager.transitionTo('BANNED', 'Account suspended by platform');
    expect(manager.getState()).toBe('BANNED');

    expect(() => manager.transitionTo('ACTIVE', 'Attempt revival')).toThrow(
      InvalidStateTransitionError
    );
  });

  it('rejects invalid state transitions', () => {
    const manager = new AccountLifecycleManager('acc-4', 'CREATED');

    // Cannot jump straight from CREATED to COOLDOWN
    expect(() => manager.transitionTo('COOLDOWN', 'Invalid jump')).toThrow(
      InvalidStateTransitionError
    );
  });

  it('records transition history and allows recovery from RESTRICTED status', () => {
    const manager = new AccountLifecycleManager('acc-5', 'ACTIVE');
    manager.transitionTo('RESTRICTED', 'Captcha challenge presented');
    expect(manager.getState()).toBe('RESTRICTED');

    manager.transitionTo('ACTIVE', 'Operator solved challenge');
    expect(manager.getState()).toBe('ACTIVE');

    const history = manager.getHistory();
    expect(history).toHaveLength(2);
    expect(history[0].from).toBe('ACTIVE');
    expect(history[0].to).toBe('RESTRICTED');
  });
});
