import { describe, it, expect } from 'vitest';
import nextConfig from '../../next.config';

describe('Security Headers Configuration (R7.6)', () => {
  it('defines comprehensive security headers including CSP, X-Frame-Options, and nosniff', async () => {
    expect(nextConfig.headers).toBeDefined();

    if (nextConfig.headers) {
      const headersList = await nextConfig.headers();
      const allRoutesHeader = headersList.find((h) => h.source === '/(.*)');

      expect(allRoutesHeader).toBeDefined();
      const headersMap = new Map(allRoutesHeader!.headers.map((h) => [h.key, h.value]));

      expect(headersMap.get('X-Frame-Options')).toBe('DENY');
      expect(headersMap.get('X-Content-Type-Options')).toBe('nosniff');
      expect(headersMap.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(headersMap.get('Content-Security-Policy')).toContain("frame-ancestors 'none'");
    }
  });
});
