import { describe, it, expect, beforeEach } from 'vitest';
import {
  KillSwitchManager,
  OperationalKillSwitchEngagedError,
} from '../kill-switch';

describe('System Kill Switch & Safety Guard', () => {
  let killSwitch: KillSwitchManager;

  beforeEach(() => {
    killSwitch = new KillSwitchManager(false);
  });

  it('initializes as inactive by default when configured as false', () => {
    expect(killSwitch.isActive()).toBe(false);
    expect(() => killSwitch.assertOperationsPermitted()).not.toThrow();
  });

  it('engages kill switch and blocks operations immediately', () => {
    killSwitch.setKillSwitch(true, 'Abnormal challenge rate detected', 'operator-1');

    expect(killSwitch.isActive()).toBe(true);
    const state = killSwitch.getState();
    expect(state.active).toBe(true);
    expect(state.reason).toBe('Abnormal challenge rate detected');
    expect(state.operatorId).toBe('operator-1');
    expect(state.updatedAt).toBeInstanceOf(Date);

    expect(() => killSwitch.assertOperationsPermitted()).toThrow(
      OperationalKillSwitchEngagedError
    );
  });

  it('allows resetting kill switch with valid reason', () => {
    killSwitch.setKillSwitch(true, 'Test trip');
    expect(killSwitch.isActive()).toBe(true);

    killSwitch.setKillSwitch(false, 'Operator verified normal state', 'operator-admin');
    expect(killSwitch.isActive()).toBe(false);
    expect(() => killSwitch.assertOperationsPermitted()).not.toThrow();
  });

  it('notifies registered listeners upon state change and supports unsubscribe', () => {
    let callCount = 0;
    const unsubscribe = killSwitch.onStateChange(() => {
      callCount++;
    });

    killSwitch.setKillSwitch(true, 'Emergency shutdown');
    expect(callCount).toBe(1);

    unsubscribe();
    killSwitch.setKillSwitch(false, 'Restart');
    expect(callCount).toBe(1); // not incremented after unsubscribe
  });

  it('initializes with active=true if constructed with true', () => {
    const activeSwitch = new KillSwitchManager(true);
    expect(activeSwitch.isActive()).toBe(true);
    expect(() => activeSwitch.assertOperationsPermitted()).toThrow();
  });
});
