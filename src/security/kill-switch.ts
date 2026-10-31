export class OperationalKillSwitchEngagedError extends Error {
  constructor(reason: string) {
    super(`Operational Kill Switch is ACTIVE: ${reason}. All browser/network automation is blocked.`);
    this.name = 'OperationalKillSwitchEngagedError';
  }
}

export interface KillSwitchState {
  active: boolean;
  reason: string;
  operatorId?: string;
  updatedAt: Date;
}

export type KillSwitchListener = (active: boolean, state: KillSwitchState) => void;

export class KillSwitchManager {
  private state: KillSwitchState;
  private listeners: KillSwitchListener[] = [];

  constructor(initialActive = false) {
    this.state = {
      active: initialActive,
      reason: initialActive ? 'Initialized as active' : 'Normal operating mode',
      updatedAt: new Date(),
    };
  }

  isActive(): boolean {
    return this.state.active;
  }

  getState(): KillSwitchState {
    return { ...this.state };
  }

  assertOperationsPermitted(): void {
    if (this.state.active) {
      throw new OperationalKillSwitchEngagedError(this.state.reason);
    }
  }

  setKillSwitch(active: boolean, reason: string, operatorId?: string): KillSwitchState {
    this.state = {
      active,
      reason,
      operatorId,
      updatedAt: new Date(),
    };

    for (const listener of this.listeners) {
      listener(active, this.state);
    }

    return this.getState();
  }

  onStateChange(listener: KillSwitchListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

// Global default singleton instance
export const globalKillSwitch = new KillSwitchManager(
  process.env.KILL_SWITCH_ACTIVE === 'true' || process.env.KILL_SWITCH_ACTIVE === '1'
);
