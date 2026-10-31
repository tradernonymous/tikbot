import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  globalKillSwitch,
  getPersistedKillSwitch,
  setPersistedKillSwitch,
  OperationalKillSwitchEngagedError,
} from '../kill-switch';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    systemSetting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

describe('Kill Switch Persistence & Polling (P5 TDD)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalKillSwitch.setKillSwitch(false, 'test reset');
  });

  it('persists kill switch activation to database and memory', async () => {
    vi.mocked(prisma.systemSetting.upsert).mockResolvedValue({
      key: 'SYSTEM_KILL_SWITCH',
      value: JSON.stringify({
        active: true,
        reason: 'Emergency stop from operator',
        operatorId: 'admin-1',
        updatedAt: new Date().toISOString(),
      }),
      updatedAt: new Date(),
    });

    const state = await setPersistedKillSwitch(true, 'Emergency stop from operator', 'admin-1');

    expect(state.active).toBe(true);
    expect(state.reason).toBe('Emergency stop from operator');
    expect(globalKillSwitch.isActive()).toBe(true);
    expect(prisma.systemSetting.upsert).toHaveBeenCalledTimes(1);
  });

  it('loads kill switch state from database when present', async () => {
    const updatedAt = new Date().toISOString();
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({
      key: 'SYSTEM_KILL_SWITCH',
      value: JSON.stringify({
        active: true,
        reason: 'DB active reason',
        operatorId: 'admin-2',
        updatedAt,
      }),
      updatedAt: new Date(),
    });

    const state = await getPersistedKillSwitch();
    expect(state.active).toBe(true);
    expect(state.reason).toBe('DB active reason');
    expect(globalKillSwitch.isActive()).toBe(true);
  });

  it('falls back to default in-memory state when DB has no record or throws', async () => {
    vi.mocked(prisma.systemSetting.findUnique).mockRejectedValue(new Error('DB unreachable'));

    const state = await getPersistedKillSwitch();
    expect(state.active).toBe(false);
  });

  it('throws OperationalKillSwitchEngagedError when active', () => {
    globalKillSwitch.setKillSwitch(true, 'Blocked');
    expect(() => globalKillSwitch.assertOperationsPermitted()).toThrow(
      OperationalKillSwitchEngagedError
    );
  });
});
