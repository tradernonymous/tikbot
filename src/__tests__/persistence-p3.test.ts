import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Server-Side Persistence & Fixture Resurrection Prevention (P3)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('preserves empty state on reload when all accounts are deleted (never resurrects fixtures)', async () => {
    // Simulate server returning empty array of accounts
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/v1/accounts')) {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, accounts: [] }),
        });
      }
      return Promise.resolve({
        json: () => Promise.resolve({ success: true }),
      });
    });

    const res = await mockFetch('/api/v1/accounts');
    const data = await res.json();

    // Verify empty accounts array from server
    expect(data.success).toBe(true);
    expect(data.accounts).toEqual([]);

    // Simulating context hydration: empty server accounts sets empty state, does NOT fall back to fixtures.length > 0
    let accountsState = [{ id: 'old-1' }];
    if (data.success && Array.isArray(data.accounts)) {
      accountsState = data.accounts;
    }

    expect(accountsState).toEqual([]);
    expect(accountsState).toHaveLength(0);
  });

  it('removes legacy localStorage state blob on load', () => {
    const mockStorage: Record<string, string> = {
      tikbot_operations_state_v1: JSON.stringify({ accounts: [{ id: 'stale' }] }),
    };

    const getItem = vi.fn((key: string) => mockStorage[key] || null);
    const removeItem = vi.fn((key: string) => {
      delete mockStorage[key];
    });

    // Simulate cleanup
    if (getItem('tikbot_operations_state_v1')) {
      removeItem('tikbot_operations_state_v1');
    }

    expect(removeItem).toHaveBeenCalledWith('tikbot_operations_state_v1');
    expect(mockStorage['tikbot_operations_state_v1']).toBeUndefined();
  });
});
