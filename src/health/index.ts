export type HealthStatus = 'UP' | 'DOWN' | 'DEGRADED';

export interface LivenessReport {
  status: HealthStatus;
  uptimeSeconds: number;
  timestamp: Date;
}

export interface ComponentStatus {
  status: HealthStatus;
  latencyMs?: number;
  error?: string;
}

export interface ReadinessReport {
  status: HealthStatus;
  timestamp: Date;
  components: {
    database: ComponentStatus;
    queue?: {
      pendingJobs: number;
    };
    worker?: {
      lastHeartbeat: string | null;
      status: 'UP' | 'DOWN' | 'IDLE';
    };
    redis?: ComponentStatus;
    killSwitch: {
      active: boolean;
    };
  };
}

export interface HealthDependencies {
  checkDatabase: () => Promise<boolean>;
  checkRedis?: () => Promise<boolean>;
  getQueueDepth?: () => Promise<number>;
  getWorkerHeartbeat?: () => Promise<string | null>;
  isKillSwitchActive: () => boolean;
}

const startTime = Date.now();

export function checkLiveness(): LivenessReport {
  return {
    status: 'UP',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date(),
  };
}

export async function checkReadiness(deps: HealthDependencies): Promise<ReadinessReport> {
  const isKillSwitchActive = deps.isKillSwitchActive();
  const dbStatus: ComponentStatus = { status: 'UP' };
  let overallStatus: HealthStatus = isKillSwitchActive ? 'DEGRADED' : 'UP';

  const dbStart = Date.now();
  try {
    const ok = await deps.checkDatabase();
    dbStatus.latencyMs = Date.now() - dbStart;
    if (!ok) {
      dbStatus.status = 'DOWN';
      overallStatus = 'DOWN';
    }
  } catch (err) {
    dbStatus.status = 'DOWN';
    dbStatus.error = err instanceof Error ? err.message : String(err);
    overallStatus = 'DOWN';
  }

  let redisStatus: ComponentStatus | undefined;
  if (deps.checkRedis) {
    const redisStart = Date.now();
    try {
      const ok = await deps.checkRedis();
      redisStatus = {
        status: ok ? 'UP' : 'DOWN',
        latencyMs: Date.now() - redisStart,
      };
      if (!ok && overallStatus !== 'DOWN') {
        overallStatus = 'DEGRADED';
      }
    } catch (err) {
      redisStatus = {
        status: 'DOWN',
        error: err instanceof Error ? err.message : String(err),
      };
      if (overallStatus !== 'DOWN') {
        overallStatus = 'DEGRADED';
      }
    }
  }

  let queueStatus: { pendingJobs: number } | undefined;
  if (deps.getQueueDepth) {
    try {
      const pendingJobs = await deps.getQueueDepth();
      queueStatus = { pendingJobs };
    } catch {
      queueStatus = { pendingJobs: 0 };
    }
  }

  let workerStatus: { lastHeartbeat: string | null; status: 'UP' | 'DOWN' | 'IDLE' } | undefined;
  if (deps.getWorkerHeartbeat) {
    try {
      const heartbeat = await deps.getWorkerHeartbeat();
      if (!heartbeat) {
        workerStatus = { lastHeartbeat: null, status: 'IDLE' };
      } else {
        const hbTime = new Date(heartbeat).getTime();
        const diffSecs = (Date.now() - hbTime) / 1000;
        const status = diffSecs < 120 ? 'UP' : 'DOWN';
        workerStatus = { lastHeartbeat: heartbeat, status };
      }
    } catch {
      workerStatus = { lastHeartbeat: null, status: 'DOWN' };
    }
  }

  return {
    status: overallStatus,
    timestamp: new Date(),
    components: {
      database: dbStatus,
      ...(queueStatus ? { queue: queueStatus } : {}),
      ...(workerStatus ? { worker: workerStatus } : {}),
      ...(redisStatus ? { redis: redisStatus } : {}),
      killSwitch: {
        active: isKillSwitchActive,
      },
    },
  };
}
