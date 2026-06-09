import Keycloak, { type KeycloakConfig, type KeycloakInitOptions } from "keycloak-js";
import { type Role, type TenantSession, ROLE_RANK } from "./roles";

const config: KeycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
};

const initOptions: KeycloakInitOptions = {
  onLoad: "login-required",
  checkLoginIframe: false,
  pkceMethod: "S256",
  silentCheckSsoFallback: false,
};

let kc: Keycloak | null = null;

function getInstance(): Keycloak {
  if (!kc) kc = new Keycloak(config);
  return kc;
}

function extractRoles(idTokenParsed: unknown): Role[] {
  const parsed = idTokenParsed as { realm_access?: { roles?: string[] } } | undefined;
  const raw = parsed?.realm_access?.roles ?? [];
  return raw.filter((r): r is Role => r === "viewer" || r === "operator" || r === "admin");
}

export async function initAuth(): Promise<TenantSession | null> {
  const authenticated = await getInstance().init(initOptions);
  if (!authenticated) return null;
  return sessionFromKeycloak(getInstance());
}

export function sessionFromKeycloak(instance: Keycloak): TenantSession | null {
  if (!instance.authenticated || !instance.tokenParsed) return null;
  const parsed = instance.tokenParsed as {
    sub: string;
    preferred_username?: string;
    email?: string;
    exp: number;
  };
  return {
    tenantId: parsed.sub,
    userId: parsed.sub,
    username: parsed.preferred_username ?? parsed.email ?? parsed.sub,
    email: parsed.email,
    roles: extractRoles(instance.idTokenParsed),
    token: instance.token ?? "",
    expiresAt: parsed.exp * 1000,
  };
}

export function getSession(): TenantSession | null {
  return sessionFromKeycloak(getInstance());
}

export function getToken(): string | null {
  return getInstance().token ?? null;
}

export async function refreshSession(): Promise<TenantSession | null> {
  const ok = await getInstance().updateToken(30);
  if (!ok) return null;
  return getSession();
}

export function logout() {
  return getInstance().logout({ redirectUri: window.location.origin });
}

export function onTokenExpired(cb: () => void) {
  getInstance().onTokenExpired = cb;
}

export function roleRankOf(role: Role): number {
  return ROLE_RANK[role];
}
