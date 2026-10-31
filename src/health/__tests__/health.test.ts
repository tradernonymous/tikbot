import { describe, it, expect, vi } from 'vitest';
import {
  checkLiveness,
  checkReadiness,
  type HealthDependencies,
} from '../index';

describe('Health & Readiness Subsystem', () => {
  it('returns healthy status on liveness probe', () => {
    const liveness = checkLiveness();
    expect(liveness.status).toBe('UP');
    expect(liveness.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(liveness.timestamp).toBeInstanceOf(Date);
  });

  it('reports healthy readiness when all dependent systems are responsive', async () => {
    const deps: HealthDependencies = {
      checkDatabase: vi.fn().mockResolvedValue(true),
      checkRedis: vi.fn().mockResolvedValue(true),
      isKillSwitchActive: vi.fn().mockReturnValue(false),
    };

    const readiness = await checkReadiness(deps);
    expect(readiness.status).toBe('UP');
    expect(readiness.components.database.status).toBe('UP');
    expect(readiness.components.redis?.status).toBe('UP');
    expect(readiness.components.killSwitch.active).toBe(false);
  });

  it('reports degraded readiness when database check fails', async () => {
    const deps: HealthDependencies = {
      checkDatabase: vi.fn().mockRejectedValue(new Error('Connection refused')),
      isKillSwitchActive: vi.fn().mockReturnValue(false),
    };

    const readiness = await checkReadiness(deps);
    expect(readiness.status).toBe('DOWN');
    expect(readiness.components.database.status).toBe('DOWN');
    expect(readiness.components.database.error).toContain('Connection refused');
  });

  it('reports DOWN when checkDatabase returns false without throwing', async () => {
    const deps: HealthDependencies = {
      checkDatabase: vi.fn().mockResolvedValue(false),
      isKillSwitchActive: vi.fn().mockReturnValue(false),
    };

    const readiness = await checkReadiness(deps);
    expect(readiness.status).toBe('DOWN');
    expect(readiness.components.database.status).toBe('DOWN');
  });

  it('reports DEGRADED when redis returns false or throws', async () => {
    const depsFailingRedis: HealthDependencies = {
      checkDatabase: vi.fn().mockResolvedValue(true),
      checkRedis: vi.fn().mockResolvedValue(false),
      isKillSwitchActive: vi.fn().mockReturnValue(false),
    };

    const readiness1 = await checkReadiness(depsFailingRedis);
    expect(readiness1.status).toBe('DEGRADED');
    expect(readiness1.components.redis?.status).toBe('DOWN');

    const depsErrorRedis: HealthDependencies = {
      checkDatabase: vi.fn().mockResolvedValue(true),
      checkRedis: vi.fn().mockRejectedValue(new Error('Redis timeout')),
      isKillSwitchActive: vi.fn().mockReturnValue(false),
    };

    const readiness2 = await checkReadiness(depsErrorRedis);
    expect(readiness2.status).toBe('DEGRADED');
    expect(readiness2.components.redis?.status).toBe('DOWN');
  });

  it('flags readiness when kill switch is active', async () => {
    const deps: HealthDependencies = {
      checkDatabase: vi.fn().mockResolvedValue(true),
      isKillSwitchActive: vi.fn().mockReturnValue(true),
    };

    const readiness = await checkReadiness(deps);
    expect(readiness.status).toBe('DEGRADED');
    expect(readiness.components.killSwitch.active).toBe(true);
  });
});
