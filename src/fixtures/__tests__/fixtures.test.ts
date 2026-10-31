import { describe, it, expect } from 'vitest';
import { getDevFixtures } from '../index';

describe('Dev Fixtures & Seed Data', () => {
  it('generates complete mock dataset with consistent relational references', () => {
    const fixtures = getDevFixtures();

    expect(fixtures.users).toHaveLength(2);
    expect(fixtures.proxies).toHaveLength(3);
    expect(fixtures.accounts.length).toBeGreaterThan(0);
    expect(fixtures.campaigns.length).toBeGreaterThan(0);
    expect(fixtures.posts.length).toBeGreaterThan(0);

    // Verify proxy binding integrity
    for (const acc of fixtures.accounts) {
      if (acc.proxyId) {
        const found = fixtures.proxies.find((p) => p.id === acc.proxyId);
        expect(found).toBeDefined();
      }
    }

    // Verify campaign approval linkage
    for (const camp of fixtures.campaigns) {
      if (camp.approvalId) {
        const found = fixtures.approvals.find((a) => a.id === camp.approvalId);
        expect(found).toBeDefined();
      }
    }
  });
});
