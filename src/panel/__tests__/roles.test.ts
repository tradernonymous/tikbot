import { describe, it, expect } from 'vitest';
import { RoleManager, UserRole, Permission, UnauthorizedError } from '../roles';

describe('RoleManager', () => {
  const roleManager = new RoleManager();

  it('allows ADMIN full access across all permissions', () => {
    const allPermissions: Permission[] = [
      'ENGAGE_KILL_SWITCH',
      'APPROVE_CAMPAIGNS',
      'DISPATCH_ENGAGEMENT',
      'MANAGE_ACCOUNTS',
      'MANAGE_KEYS',
      'VIEW_AUDIT_LOGS',
      'VIEW_METRICS',
    ];

    for (const perm of allPermissions) {
      expect(roleManager.hasPermission('ADMIN', perm)).toBe(true);
      expect(() => roleManager.assertPermission('ADMIN', perm)).not.toThrow();
    }
  });

  it('restricts OPERATOR from managing secret keys and global kill switch override', () => {
    expect(roleManager.hasPermission('OPERATOR', 'DISPATCH_ENGAGEMENT')).toBe(true);
    expect(roleManager.hasPermission('OPERATOR', 'APPROVE_CAMPAIGNS')).toBe(true);
    expect(roleManager.hasPermission('OPERATOR', 'MANAGE_KEYS')).toBe(false);

    expect(() => roleManager.assertPermission('OPERATOR', 'MANAGE_KEYS')).toThrow(UnauthorizedError);
  });

  it('grants ANALYST read-only metrics access', () => {
    expect(roleManager.hasPermission('ANALYST', 'VIEW_METRICS')).toBe(true);
    expect(roleManager.hasPermission('ANALYST', 'DISPATCH_ENGAGEMENT')).toBe(false);
    expect(roleManager.hasPermission('ANALYST', 'APPROVE_CAMPAIGNS')).toBe(false);
  });

  it('grants AUDITOR access to audit logs and metrics only', () => {
    expect(roleManager.hasPermission('AUDITOR', 'VIEW_AUDIT_LOGS')).toBe(true);
    expect(roleManager.hasPermission('AUDITOR', 'VIEW_METRICS')).toBe(true);
    expect(roleManager.hasPermission('AUDITOR', 'MANAGE_ACCOUNTS')).toBe(false);
  });
});
