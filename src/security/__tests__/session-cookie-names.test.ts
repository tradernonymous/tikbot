import { describe, it, expect } from 'vitest';
import { readSessionTokenFromCookies } from '../auth';

describe('readSessionTokenFromCookies', () => {
  it('reads the production __Host- cookie', () => {
    const jar: Record<string, string> = { '__Host-tikbot_session': 'prod-token' };
    expect(readSessionTokenFromCookies((n) => (jar[n] ? { value: jar[n] } : undefined))).toBe('prod-token');
  });
  it('reads the development cookie', () => {
    const jar: Record<string, string> = { tikbot_session: 'dev-token' };
    expect(readSessionTokenFromCookies((n) => (jar[n] ? { value: jar[n] } : undefined))).toBe('dev-token');
  });
  it('returns undefined when neither exists', () => {
    expect(readSessionTokenFromCookies(() => undefined)).toBeUndefined();
  });
});
