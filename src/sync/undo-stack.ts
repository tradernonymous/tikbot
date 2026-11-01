import { broadcastSyncEvent } from './client-event-bus';

export interface UndoableAction {
  id: string;
  description: string;
  undo: () => Promise<void> | void;
  redo?: () => Promise<void> | void;
  timestamp: string;
}

const MAX_STACK_DEPTH = 10;

export class UndoStackManager {
  private undoStack: UndoableAction[] = [];
  private redoStack: UndoableAction[] = [];
  private onUndoToast?: (msg: string) => void;

  constructor(options?: { onUndoToast?: (msg: string) => void }) {
    this.onUndoToast = options?.onUndoToast;
  }

  public getStackDepth(): number {
    return this.undoStack.length;
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public pushAction(action: Omit<UndoableAction, 'id' | 'timestamp'>): UndoableAction {
    const fullAction: UndoableAction = {
      ...action,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    this.undoStack.push(fullAction);
    if (this.undoStack.length > MAX_STACK_DEPTH) {
      this.undoStack.shift(); // Evict oldest
    }
    // New action invalidates previous redo history
    this.redoStack = [];

    broadcastSyncEvent({
      type: 'UNDO_AVAILABLE',
      payload: { canUndo: true, description: fullAction.description },
    });

    return fullAction;
  }

  public async undo(): Promise<UndoableAction | null> {
    const action = this.undoStack.pop();
    if (!action) return null;

    try {
      await action.undo();
      if (action.redo) {
        this.redoStack.push(action);
      }
      if (this.onUndoToast) {
        this.onUndoToast(`Undone: ${action.description}`);
      }
      broadcastSyncEvent({
        type: 'UNDO_AVAILABLE',
        payload: { canUndo: this.canUndo(), undone: action.description },
      });
      return action;
    } catch (err) {
      // Re-insert if undo failed
      this.undoStack.push(action);
      throw err;
    }
  }

  public async redo(): Promise<UndoableAction | null> {
    const action = this.redoStack.pop();
    if (!action || !action.redo) return null;

    try {
      await action.redo();
      this.undoStack.push(action);
      broadcastSyncEvent({
        type: 'UNDO_AVAILABLE',
        payload: { canUndo: true, reapplied: action.description },
      });
      return action;
    } catch (err) {
      this.redoStack.push(action);
      throw err;
    }
  }

  public clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}

// Global Singleton
const UNDO_KEY = '__TIKBOT_GLOBAL_UNDO_STACK__';

export function getGlobalUndoStack(): UndoStackManager {
  const g = globalThis as any;
  if (!g[UNDO_KEY]) {
    g[UNDO_KEY] = new UndoStackManager();
  }
  return g[UNDO_KEY];
}

export function resetGlobalUndoStackForTesting(): void {
  const g = globalThis as any;
  if (g[UNDO_KEY]) {
    g[UNDO_KEY].clear();
    delete g[UNDO_KEY];
  }
}
