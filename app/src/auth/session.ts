import {
  getToken,
  refreshSession,
  onTokenExpired,
  logout as keycloakLogout,
} from "./keycloak";
import type { TenantSession } from "@/lib/roles";

let memSession: TenantSession | null = null;

export function setSession(s: TenantSession | null) {
  memSession = s;
}

export function getSession_(): TenantSession | null {
  return memSession;
}

onTokenExpired(async () => {
  const refreshed = await refreshSession();
  if (!refreshed) {
    keycloakLogout();
  } else {
    setSession(refreshed);
  }
});

export async function authHeaders(): Promise<Record<string, string>> {
  const token = getToken();
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
    "X-Tenant-Id": memSession?.tenantId ?? "",
  };
}
