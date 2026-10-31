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

export const KILL_SWITCH_SETTING_KEY = 'SYSTEM_KILL_SWITCH';

export async function getPersistedKillSwitch(): Promise<KillSwitchState> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const record = await prisma.systemSetting.findUnique({
      where: { key: KILL_SWITCH_SETTING_KEY },
    });

    if (record?.value) {
      const parsed = JSON.parse(record.value);
      if (typeof parsed.active === 'boolean') {
        globalKillSwitch.setKillSwitch(
          parsed.active,
          parsed.reason || 'Synchronized from database',
          parsed.operatorId
        );
        return globalKillSwitch.getState();
      }
    }
  } catch (err) {
    // Non-fatal fallback to in-memory state
  }

  return globalKillSwitch.getState();
}

export async function setPersistedKillSwitch(
  active: boolean,
  reason: string,
  operatorId?: string
): Promise<KillSwitchState> {
  const state = globalKillSwitch.setKillSwitch(active, reason, operatorId);

  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.systemSetting.upsert({
      where: { key: KILL_SWITCH_SETTING_KEY },
      update: {
        value: JSON.stringify(state),
      },
      create: {
        key: KILL_SWITCH_SETTING_KEY,
        value: JSON.stringify(state),
      },
    });
  } catch (err) {
    console.error('[KillSwitch] Failed to persist kill switch to database:', err);
  }

  return state;
}
