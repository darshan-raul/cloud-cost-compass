import type { AuthBindings } from "@refinedev/core";
import {
  getSession,
  getToken,
  initAuth,
  logout as keycloakLogout,
  refreshSession,
} from "./keycloak";
import { setSession, getSession_ } from "./session";
import type { TenantSession } from "@/lib/roles";

export const authProvider: AuthBindings = {
  async login() {
    const s = await initAuth();
    setSession(s);
    return { success: !!s, redirectTo: s ? "/" : "/login" };
  },
  async logout() {
    keycloakLogout({ redirectUri: window.location.origin + "/login" });
    setSession(null);
    return { success: true, redirectTo: "/login" };
  },
  async check() {
    let s = getSession();
    if (!s) {
      s = await initAuth();
      setSession(s);
    } else {
      const refreshed = await refreshSession();
      if (refreshed) setSession(refreshed);
    }
    return s ? { authenticated: true } : { authenticated: false, redirectTo: "/login" };
  },
  async getIdentity() {
    const s: TenantSession | null = getSession_() ?? getSession();
    if (!s) return null;
    return {
      id: s.userId,
      name: s.username,
      email: s.email,
      avatar: undefined,
      tenantId: s.tenantId,
      roles: s.roles,
    };
  },
  async getPermissions() {
    const s = getSession_();
    return s?.roles ?? [];
  },
  async onError(error) {
    if (error?.statusCode === 401) return { logout: true, redirectTo: "/login" };
    return {};
  },
};

export function getAuthToken(): string | null {
  return getToken();
}
