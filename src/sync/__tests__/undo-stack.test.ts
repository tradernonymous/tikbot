import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  UndoStackManager,
  getGlobalUndoStack,
  resetGlobalUndoStackForTesting,
} from '../undo-stack';

describe('S2.6 Global Undo Stack (Command Pattern)', () => {
  beforeEach(() => {
    resetGlobalUndoStackForTesting();
  });

  it('pushes actions, respects 10-step cap, and executes undo in LIFO order', async () => {
    const stack = new UndoStackManager();
    const executedUndos: string[] = [];

    // Push 12 actions to verify max capacity 10
    for (let i = 1; i <= 12; i++) {
      stack.pushAction({
        description: `Action ${i}`,
        undo: () => {
          executedUndos.push(`undo-${i}`);
        },
      });
    }

    expect(stack.getStackDepth()).toBe(10);
    expect(stack.canUndo()).toBe(true);

    // Undo action 12
    const undone1 = await stack.undo();
    expect(undone1?.description).toBe('Action 12');
    expect(executedUndos).toEqual(['undo-12']);

    // Undo action 11
    const undone2 = await stack.undo();
    expect(undone2?.description).toBe('Action 11');
    expect(executedUndos).toEqual(['undo-12', 'undo-11']);

    expect(stack.getStackDepth()).toBe(8);
  });

  it('handles redo if redo handler is provided', async () => {
    const stack = new UndoStackManager();
    let value = 'original';

    stack.pushAction({
      description: 'Update value',
      undo: () => {
        value = 'reverted';
      },
      redo: () => {
        value = 'reapplied';
      },
    });

    expect(stack.canUndo()).toBe(true);
    expect(stack.canRedo()).toBe(false);

    await stack.undo();
    expect(value).toBe('reverted');
    expect(stack.canRedo()).toBe(true);

    await stack.redo();
    expect(value).toBe('reapplied');
    expect(stack.canRedo()).toBe(false);
  });

  it('handles undo errors by restoring action to stack', async () => {
    const stack = new UndoStackManager();
    stack.pushAction({
      description: 'Failing action',
      undo: () => {
        throw new Error('Undo failure');
      },
    });

    await expect(stack.undo()).rejects.toThrow('Undo failure');
    expect(stack.canUndo()).toBe(true); // Restored
  });

  it('handles redo errors by restoring action to redo stack', async () => {
    const stack = new UndoStackManager();
    stack.pushAction({
      description: 'Failing redo action',
      undo: () => {},
      redo: () => {
        throw new Error('Redo failure');
      },
    });

    await stack.undo();
    expect(stack.canRedo()).toBe(true);
    await expect(stack.redo()).rejects.toThrow('Redo failure');
    expect(stack.canRedo()).toBe(true); // Restored
  });

  it('triggers onUndoToast callback when provided', async () => {
    const toastFn = vi.fn();
    const stack = new UndoStackManager({ onUndoToast: toastFn });
    stack.pushAction({
      description: 'Delete item',
      undo: () => {},
    });

    await stack.undo();
    expect(toastFn).toHaveBeenCalledWith('Undone: Delete item');
  });

  it('returns null and does not throw when undoing or redoing on empty stack', async () => {
    const stack = new UndoStackManager();
    expect(stack.canUndo()).toBe(false);
    expect(stack.canRedo()).toBe(false);
    const resultUndo = await stack.undo();
    const resultRedo = await stack.redo();
    expect(resultUndo).toBeNull();
    expect(resultRedo).toBeNull();
  });

  it('manages singleton instance and reset helper', () => {
    const g1 = getGlobalUndoStack();
    const g2 = getGlobalUndoStack();
    expect(g1).toBe(g2);

    resetGlobalUndoStackForTesting();
    const g3 = getGlobalUndoStack();
    expect(g3).not.toBe(g1);
  });
});
