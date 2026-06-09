export type Role = "viewer" | "operator" | "admin";

export const ROLE_RANK: Record<Role, number> = {
  viewer: 1,
  operator: 2,
  admin: 3,
};

export interface TenantSession {
  tenantId: string;
  userId: string;
  username: string;
  email?: string;
  roles: Role[];
  token: string;
  expiresAt: number;
}

export function hasRole(session: TenantSession | null, min: Role): boolean {
  if (!session) return false;
  const max = Math.max(...session.roles.map((r) => ROLE_RANK[r] ?? 0));
  return max >= ROLE_RANK[min];
}

export function highestRole(session: TenantSession | null): Role | null {
  if (!session || session.roles.length === 0) return null;
  return session.roles.reduce<Role>(
    (acc, r) => (ROLE_RANK[r] > ROLE_RANK[acc] ? r : acc),
    "viewer",
  );
}
