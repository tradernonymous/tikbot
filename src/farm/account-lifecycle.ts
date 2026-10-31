export type AccountState =
  | 'CREATED'
  | 'WARMING'
  | 'ACTIVE'
  | 'COOLDOWN'
  | 'RESTRICTED'
  | 'BANNED';

export class InvalidStateTransitionError extends Error {
  constructor(from: AccountState, to: AccountState, reason: string) {
    super(`Invalid account state transition from "${from}" to "${to}": ${reason}`);
    this.name = 'InvalidStateTransitionError';
  }
}

export interface StateTransitionEvent {
  from: AccountState;
  to: AccountState;
  reason: string;
  timestamp: Date;
}

const ALLOWED_TRANSITIONS: Record<AccountState, Set<AccountState>> = {
  CREATED: new Set(['WARMING', 'RESTRICTED', 'BANNED']),
  WARMING: new Set(['ACTIVE', 'RESTRICTED', 'BANNED']),
  ACTIVE: new Set(['COOLDOWN', 'RESTRICTED', 'BANNED']),
  COOLDOWN: new Set(['ACTIVE', 'RESTRICTED', 'BANNED']),
  RESTRICTED: new Set(['ACTIVE', 'WARMING', 'BANNED']),
  BANNED: new Set([]), // Terminal state
};

export class AccountLifecycleManager {
  private history: StateTransitionEvent[] = [];

  constructor(
    public readonly accountId: string,
    private currentState: AccountState = 'CREATED'
  ) {}

  getState(): AccountState {
    return this.currentState;
  }

  getHistory(): StateTransitionEvent[] {
    return [...this.history];
  }

  transitionTo(nextState: AccountState, reason: string): AccountState {
    const allowed = ALLOWED_TRANSITIONS[this.currentState];
    if (!allowed.has(nextState)) {
      throw new InvalidStateTransitionError(
        this.currentState,
        nextState,
        `Cannot move directly from ${this.currentState} to ${nextState}`
      );
    }

    const event: StateTransitionEvent = {
      from: this.currentState,
      to: nextState,
      reason,
      timestamp: new Date(),
    };

    this.history.push(event);
    this.currentState = nextState;
    return this.currentState;
  }
}
