import { describe, it, expect } from 'vitest';
import { POST } from '../route';

describe('POST /api/v1/auth/logout', () => {
  it('clears both production and development session cookies', async () => {
    const res = await POST();
    const setCookie = res.headers.get('set-cookie') || '';
    expect(setCookie).toContain('__Host-tikbot_session=;');
    expect(setCookie).toContain('tikbot_session=;');
  });
});
