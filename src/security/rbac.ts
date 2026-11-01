export type Role = 'ADMIN' | 'MANAGER' | 'ANALYST' | 'VIEWER';

export type Permission =
  | 'system:manage'
  | 'accounts:mutate'
  | 'campaigns:manage'
  | 'publish:create'
  | 'research:read'
  | 'reports:read'
  | 'overview:read';

export class UnauthorizedRoleError extends Error {
  constructor(role: Role, permission: Permission) {
    super(`Forbidden: Role '${role}' lacks required permission '${permission}'`);
    this.name = 'UnauthorizedRoleError';
  }
}

const ROLE_PERMISSIONS: Record<Role, Set<Permission>> = {
  ADMIN: new Set([
    'system:manage',
    'accounts:mutate',
    'campaigns:manage',
    'publish:create',
    'research:read',
    'reports:read',
    'overview:read',
  ]),
  MANAGER: new Set([
    'accounts:mutate',
    'campaigns:manage',
    'publish:create',
    'research:read',
    'reports:read',
    'overview:read',
  ]),
  ANALYST: new Set([
    'research:read',
    'reports:read',
    'overview:read',
  ]),
  VIEWER: new Set([
    'overview:read',
  ]),
};

export function hasPermission(role: Role, permission: Permission): boolean {
  const allowed = ROLE_PERMISSIONS[role];
  return allowed ? allowed.has(permission) : false;
}

export function authorizeRequest(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new UnauthorizedRoleError(role, permission);
  }
}
