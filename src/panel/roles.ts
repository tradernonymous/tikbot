export type UserRole = 'ADMIN' | 'OPERATOR' | 'ANALYST' | 'AUDITOR';

export type Permission =
  | 'ENGAGE_KILL_SWITCH'
  | 'APPROVE_CAMPAIGNS'
  | 'DISPATCH_ENGAGEMENT'
  | 'MANAGE_ACCOUNTS'
  | 'MANAGE_KEYS'
  | 'VIEW_AUDIT_LOGS'
  | 'VIEW_METRICS';

export class UnauthorizedError extends Error {
  constructor(role: UserRole, permission: Permission) {
    super(`Role "${role}" does not have permission "${permission}".`);
    this.name = 'UnauthorizedError';
  }
}

const ROLE_PERMISSIONS: Record<UserRole, Set<Permission>> = {
  ADMIN: new Set([
    'ENGAGE_KILL_SWITCH',
    'APPROVE_CAMPAIGNS',
    'DISPATCH_ENGAGEMENT',
    'MANAGE_ACCOUNTS',
    'MANAGE_KEYS',
    'VIEW_AUDIT_LOGS',
    'VIEW_METRICS',
  ]),
  OPERATOR: new Set([
    'ENGAGE_KILL_SWITCH',
    'APPROVE_CAMPAIGNS',
    'DISPATCH_ENGAGEMENT',
    'MANAGE_ACCOUNTS',
    'VIEW_AUDIT_LOGS',
    'VIEW_METRICS',
  ]),
  ANALYST: new Set(['VIEW_METRICS']),
  AUDITOR: new Set(['VIEW_AUDIT_LOGS', 'VIEW_METRICS']),
};

export class RoleManager {
  hasPermission(role: UserRole, permission: Permission): boolean {
    const allowed = ROLE_PERMISSIONS[role];
    if (!allowed) return false;
    return allowed.has(permission);
  }

  assertPermission(role: UserRole, permission: Permission): void {
    if (!this.hasPermission(role, permission)) {
      throw new UnauthorizedError(role, permission);
    }
  }
}
