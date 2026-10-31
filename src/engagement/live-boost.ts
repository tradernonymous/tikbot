import { randomUUID } from 'node:crypto';
import { KillSwitchManager, globalKillSwitch } from '../security/kill-switch';

export type LiveBoostStatus = 'PENDING' | 'STREAMING' | 'ENDED' | 'TERMINATED';

export interface LiveBoostConfig {
  liveUrl: string;
  accountIds: string[];
  durationMinutes: number;
  chatTemplates?: string[];
  maxViewersCap?: number;
}

export interface ChatEvent {
  offsetSec: number;
  message: string;
}

export interface ViewerSchedule {
  accountId: string;
  joinOffsetSec: number;
  watchDurationSec: number;
  chatEvents: ChatEvent[];
}

export interface LiveBoostSession {
  id: string;
  liveUrl: string;
  accountIds: string[];
  durationMinutes: number;
  status: LiveBoostStatus;
  chatTemplates: string[];
  startedAt?: Date;
  endedAt?: Date;
}

export const MAX_SAFE_LIVE_VIEWERS = 50;

export class LiveBoostSessionManager {
  private sessions = new Map<string, LiveBoostSession>();
  private killSwitch: KillSwitchManager;

  constructor(options: { killSwitch?: KillSwitchManager } = {}) {
    this.killSwitch = options.killSwitch || globalKillSwitch;
  }

  createSession(config: LiveBoostConfig): LiveBoostSession {
    this.killSwitch.assertOperationsPermitted();

    const maxCap = config.maxViewersCap ?? MAX_SAFE_LIVE_VIEWERS;
    if (config.accountIds.length > maxCap) {
      throw new Error(`Account pool exceeds maximum safety cap of ${maxCap} live viewers`);
    }

    const session: LiveBoostSession = {
      id: randomUUID(),
      liveUrl: config.liveUrl,
      accountIds: [...config.accountIds],
      durationMinutes: Math.min(config.durationMinutes, 120),
      status: 'PENDING',
      chatTemplates: config.chatTemplates || ['Love this live!', 'Great vibe!', 'Greetings!'],
    };

    this.sessions.set(session.id, session);
    return session;
  }

  getSession(id: string): LiveBoostSession | undefined {
    return this.sessions.get(id);
  }

  startSession(id: string): LiveBoostSession {
    this.assertSessionCanRun(id);
    const session = this.sessions.get(id);
    if (!session) throw new Error(`Session ${id} not found`);

    session.status = 'STREAMING';
    session.startedAt = new Date();
    return session;
  }

  assertSessionCanRun(id: string): void {
    this.killSwitch.assertOperationsPermitted();
    const session = this.sessions.get(id);
    if (!session) throw new Error(`Session ${id} not found`);
    if (session.status === 'TERMINATED') {
      throw new Error(`Session ${id} has been terminated`);
    }
  }

  emergencyHaltAll(): void {
    for (const session of this.sessions.values()) {
      if (session.status === 'PENDING' || session.status === 'STREAMING') {
        session.status = 'TERMINATED';
        session.endedAt = new Date();
      }
    }
  }

  generateViewerSchedule(sessionId: string): ViewerSchedule[] {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const totalDurationSec = session.durationMinutes * 60;

    return session.accountIds.map((accountId, index) => {
      // Stagger join times across first 5-10 minutes
      const joinOffsetSec = index * 30 + Math.floor(Math.random() * 15);
      const remainingSec = Math.max(60, totalDurationSec - joinOffsetSec);
      const watchDurationSec = Math.floor(remainingSec * (0.6 + Math.random() * 0.4));

      // Generate 1-3 natural chat messages spaced apart
      const chatEvents: ChatEvent[] = [];
      const numChats = Math.min(session.chatTemplates.length, 1 + Math.floor(Math.random() * 2));
      for (let i = 0; i < numChats; i++) {
        const offsetSec = joinOffsetSec + 60 + i * 180 + Math.floor(Math.random() * 60);
        if (offsetSec < joinOffsetSec + watchDurationSec) {
          chatEvents.push({
            offsetSec,
            message: session.chatTemplates[(index + i) % session.chatTemplates.length],
          });
        }
      }

      return {
        accountId,
        joinOffsetSec,
        watchDurationSec,
        chatEvents,
      };
    });
  }
}
